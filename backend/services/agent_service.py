import sys
import os
import re
import uuid
import httpx
import pandas as pd
from pathlib import Path

# Add parent directory to path for importing existing agent
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents import Runner
from agent import data_analyst
from tools import LOADED_DATASETS
from core.config import settings

# Supabase client for uploading charts
from supabase import create_client


class AgentService:
    """Service for interacting with the data analysis agent."""

    def __init__(self, user_id: str):
        """Initialize agent service for a specific user."""
        self.user_id = user_id
        self.user_data_dir = Path(f"user_data/{user_id}")
        self.user_output_dir = Path(f"user_output/{user_id}")

        # Create user directories
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        self.user_output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize Supabase client if configured
        self.supabase = None
        if settings.supabase_url and settings.supabase_anon_key:
            self.supabase = create_client(settings.supabase_url, settings.supabase_anon_key)

    async def chat(self, message: str, conversation_history: list[dict] = None, file_info: dict = None) -> dict:
        """
        Send a message to the agent and get a response.

        Args:
            message: User's message
            conversation_history: List of previous messages for context
            file_info: Dict with filename and download_url from Supabase Storage

        Returns:
            dict with response text, charts, and any data previews
        """
        # Download and load file if provided
        if file_info and file_info.get("download_url"):
            await self._download_and_load_file(file_info)

        # Build context from history
        context = ""
        if conversation_history:
            for msg in conversation_history[-5:]:  # Keep last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                context += f"{role}: {content}\n"

        # Add loaded files info to message context
        loaded_files = list(LOADED_DATASETS.keys())
        if loaded_files:
            message = f"[Available datasets: {', '.join(loaded_files)}]\n\n{message}"

        # Run the agent
        full_message = f"{context}\nuser: {message}" if context else message

        try:
            result = await Runner.run(
                data_analyst,
                full_message,
            )

            # Extract response
            response_text = result.final_output if hasattr(result, 'final_output') else str(result)

            # Check for generated charts (look for file paths in response)
            local_charts = self._extract_chart_paths(response_text)

            # Upload charts to Supabase and get public URLs
            chart_urls = []
            for chart_path in local_charts:
                url = await self._upload_chart_to_supabase(chart_path)
                if url:
                    chart_urls.append(url)

            return {
                "response": response_text,
                "charts": chart_urls,
                "datasets_loaded": list(LOADED_DATASETS.keys()),
            }

        except Exception as e:
            return {
                "response": f"Error processing request: {str(e)}",
                "charts": [],
                "datasets_loaded": list(LOADED_DATASETS.keys()),
                "error": True,
            }

    async def _download_and_load_file(self, file_info: dict) -> bool:
        """Download file from Supabase Storage URL and load into LOADED_DATASETS."""
        try:
            filename = file_info.get("filename", "data.csv")
            download_url = file_info.get("download_url")

            if not download_url:
                print(f"No download URL for file: {filename}")
                return False

            # Skip if already loaded
            if filename in LOADED_DATASETS:
                print(f"File already loaded: {filename}")
                return True

            # Download file content
            async with httpx.AsyncClient() as client:
                response = await client.get(download_url)
                response.raise_for_status()
                content = response.content

            # Save to local user directory
            local_path = self.user_data_dir / filename
            local_path.write_bytes(content)

            # Load into pandas DataFrame
            if filename.lower().endswith('.csv'):
                df = pd.read_csv(local_path)
            elif filename.lower().endswith(('.xlsx', '.xls')):
                df = pd.read_excel(local_path)
            else:
                print(f"Unsupported file type: {filename}")
                return False

            # Add to LOADED_DATASETS so agent can access it
            LOADED_DATASETS[filename] = df
            print(f"Loaded file: {filename} with {len(df)} rows")
            return True

        except Exception as e:
            print(f"Failed to download/load file: {e}")
            return False

    def _extract_chart_paths(self, response: str) -> list[str]:
        """Extract chart file paths from agent response."""
        charts = []
        # Look for PNG file paths in output directory
        pattern = r'output/[\w_/-]+\.png'
        matches = re.findall(pattern, response)
        charts.extend(matches)

        # Also check for charts saved by tools
        output_dir = Path(__file__).parent.parent.parent / "output"
        if output_dir.exists():
            for png_file in output_dir.glob("*.png"):
                # Check if file was created recently (within last 30 seconds)
                import time
                if time.time() - png_file.stat().st_mtime < 30:
                    rel_path = f"output/{png_file.name}"
                    if rel_path not in charts:
                        charts.append(rel_path)

        return charts

    async def _upload_chart_to_supabase(self, local_path: str) -> str | None:
        """Upload a chart to Supabase Storage and return the public URL."""
        if not self.supabase:
            # Return local path if Supabase not configured
            return f"/output/{Path(local_path).name}"

        try:
            # Resolve the full path
            full_path = Path(__file__).parent.parent.parent / local_path
            if not full_path.exists():
                print(f"Chart file not found: {full_path}")
                return None

            # Generate unique filename
            chart_id = str(uuid.uuid4())
            filename = f"{self.user_id}/{chart_id}.png"

            # Read file content
            with open(full_path, "rb") as f:
                file_content = f.read()

            # Upload to Supabase Storage (charts bucket is public)
            result = self.supabase.storage.from_("charts").upload(
                filename,
                file_content,
                {"content-type": "image/png"}
            )

            # Get public URL
            public_url = self.supabase.storage.from_("charts").get_public_url(filename)

            return public_url

        except Exception as e:
            print(f"Failed to upload chart: {e}")
            # Fallback to local path
            return f"/output/{Path(local_path).name}"

    def list_files(self) -> list[dict]:
        """List data files for this user."""
        files = []
        if self.user_data_dir.exists():
            for f in self.user_data_dir.iterdir():
                if f.suffix.lower() in ['.csv', '.xlsx', '.xls']:
                    files.append({
                        "filename": f.name,
                        "size": f.stat().st_size,
                        "modified": f.stat().st_mtime,
                    })
        return files

    def save_file(self, filename: str, content: bytes) -> str:
        """Save uploaded file to user's data directory."""
        file_path = self.user_data_dir / filename
        file_path.write_bytes(content)
        return str(file_path)

    def delete_file(self, filename: str) -> bool:
        """Delete a file from user's data directory."""
        file_path = self.user_data_dir / filename
        if file_path.exists():
            file_path.unlink()
            # Also remove from loaded datasets if present
            if filename in LOADED_DATASETS:
                del LOADED_DATASETS[filename]
            return True
        return False
