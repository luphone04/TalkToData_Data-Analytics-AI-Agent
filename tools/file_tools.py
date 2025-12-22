"""
File tools for the Data Analysis Agent.
Handles file discovery, loading, and column inspection.
"""

import os
from pathlib import Path

import pandas as pd
from agents import function_tool

# Import the shared dataset registry
from . import LOADED_DATASETS

# Base directory for data files (relative to project root)
DATA_DIR = Path(__file__).parent.parent / "data"


def _validate_filename(filename: str) -> tuple[bool, str]:
    """
    Validate filename to prevent path traversal attacks.
    Returns (is_valid, error_message).
    """
    # Check for path traversal attempts
    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
        return False, "Invalid filename: path traversal not allowed"

    # Check for valid extension
    valid_extensions = {".csv", ".xlsx", ".xls"}
    ext = Path(filename).suffix.lower()
    if ext not in valid_extensions:
        return False, f"Invalid file type: {ext}. Supported types: CSV, XLSX, XLS"

    # Check if file exists
    file_path = DATA_DIR / filename
    if not file_path.exists():
        return False, f"File not found: {filename}"

    # Ensure the resolved path is still within DATA_DIR
    try:
        resolved = file_path.resolve()
        data_resolved = DATA_DIR.resolve()
        if not str(resolved).startswith(str(data_resolved)):
            return False, "Invalid filename: path traversal not allowed"
    except Exception:
        return False, "Invalid filename"

    return True, ""


# ============================================================
# Implementation functions (callable for testing)
# ============================================================

def _list_data_files() -> str:
    """List all available data files - both pre-loaded from Supabase and local files."""
    result_lines = []

    # First, list any pre-loaded datasets (from Supabase Storage)
    if LOADED_DATASETS:
        result_lines.append("Loaded datasets (ready for analysis):")
        result_lines.append("")
        for filename, df in LOADED_DATASETS.items():
            rows, cols = df.shape
            result_lines.append(f"  - {filename} ({rows} rows, {cols} columns) [loaded]")
        result_lines.append("")

    # Then check local data directory (for local development)
    local_files = []
    if DATA_DIR.exists():
        for ext in ["*.csv", "*.xlsx", "*.xls"]:
            local_files.extend(DATA_DIR.glob(ext))

    # Only show local files that aren't already loaded
    unloaded_local = [f for f in local_files if f.name not in LOADED_DATASETS]

    if unloaded_local:
        if result_lines:
            result_lines.append("Local files (not yet loaded):")
        else:
            result_lines.append("Available local files:")
        result_lines.append("")

        for f in sorted(unloaded_local):
            size_bytes = f.stat().st_size
            if size_bytes < 1024:
                size_str = f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                size_str = f"{size_bytes / 1024:.1f} KB"
            else:
                size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
            result_lines.append(f"  - {f.name} ({size_str})")
        result_lines.append("")

    # If nothing found
    if not LOADED_DATASETS and not local_files:
        return "No datasets available. Please upload a file through the web interface."

    total_count = len(LOADED_DATASETS) + len(unloaded_local)
    result_lines.append(f"Total: {total_count} file(s)")

    if LOADED_DATASETS:
        result_lines.append("Loaded datasets are ready - use describe_data or get_column_info to explore them.")
    if unloaded_local:
        result_lines.append("Use load_dataset(filename) to load a local file.")

    return "\n".join(result_lines)


def _load_dataset(filename: str) -> str:
    """Load a CSV or Excel file into memory for analysis."""
    # Check if already loaded (from Supabase Storage upload)
    if filename in LOADED_DATASETS:
        df = LOADED_DATASETS[filename]
        result_lines = [
            f"Dataset already loaded: {filename}",
            "",
            f"Shape: {df.shape[0]} rows x {df.shape[1]} columns",
            "",
            "Columns:",
        ]
        for col in df.columns:
            dtype = str(df[col].dtype)
            result_lines.append(f"  - {col} ({dtype})")
        result_lines.append("")
        result_lines.append("Preview (first 3 rows):")
        result_lines.append(df.head(3).to_string())
        return "\n".join(result_lines)

    # Validate filename for local file
    is_valid, error_msg = _validate_filename(filename)
    if not is_valid:
        return f"Error: {error_msg}"

    file_path = DATA_DIR / filename

    try:
        # Load based on file extension
        ext = Path(filename).suffix.lower()
        if ext == ".csv":
            df = pd.read_csv(file_path)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        else:
            return f"Error: Unsupported file type: {ext}"

        # Store in registry
        LOADED_DATASETS[filename] = df

        # Build summary
        result_lines = [
            f"Successfully loaded: {filename}",
            "",
            f"Shape: {df.shape[0]} rows x {df.shape[1]} columns",
            "",
            "Columns:",
        ]

        for col in df.columns:
            dtype = str(df[col].dtype)
            result_lines.append(f"  - {col} ({dtype})")

        result_lines.append("")
        result_lines.append("Preview (first 3 rows):")
        result_lines.append(df.head(3).to_string())

        return "\n".join(result_lines)

    except pd.errors.EmptyDataError:
        return f"Error: File '{filename}' is empty."
    except pd.errors.ParserError as e:
        return f"Error: Could not parse '{filename}'. Invalid format. {str(e)}"
    except Exception as e:
        return f"Error loading '{filename}': {str(e)}"


def _get_column_info(filename: str) -> str:
    """Get detailed information about each column in a loaded dataset."""
    # Check if dataset is loaded
    df = LOADED_DATASETS.get(filename)
    if df is None:
        return f"Error: '{filename}' is not loaded. Use load_dataset('{filename}') first."

    result_lines = [f"Column details for: {filename}", "=" * 50, ""]

    for col in df.columns:
        series = df[col]
        dtype = str(series.dtype)
        null_count = series.isna().sum()
        unique_count = series.nunique()
        total_count = len(series)

        # Determine data category
        if pd.api.types.is_numeric_dtype(series):
            data_category = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            data_category = "datetime"
        else:
            data_category = "text/categorical"

        # Get sample values (non-null, up to 5)
        non_null = series.dropna()
        if len(non_null) > 0:
            samples = non_null.head(5).tolist()
            samples_str = ", ".join(str(s) for s in samples)
            if len(samples_str) > 60:
                samples_str = samples_str[:57] + "..."
        else:
            samples_str = "(all null)"

        result_lines.append(f"Column: {col}")
        result_lines.append(f"  Type: {dtype} ({data_category})")
        result_lines.append(f"  Nulls: {null_count}/{total_count} ({100*null_count/total_count:.1f}%)")
        result_lines.append(f"  Unique values: {unique_count}")
        result_lines.append(f"  Sample values: {samples_str}")
        result_lines.append("")

    return "\n".join(result_lines)


# ============================================================
# Function tools for the agent (wrappers with proper docstrings)
# ============================================================

@function_tool
def list_data_files() -> str:
    """
    List all available data files in the data directory.
    Shows CSV and Excel files with their sizes.
    Use this first to see what data is available for analysis.
    """
    return _list_data_files()


@function_tool
def load_dataset(filename: str) -> str:
    """
    Load a CSV or Excel file into memory for analysis.
    If the file is already loaded (from user upload), returns its info directly.

    Args:
        filename: Name of the file to load (e.g., 'sales.csv').

    Returns:
        Summary of the loaded dataset including row count, columns, and preview.
    """
    return _load_dataset(filename)


@function_tool
def get_column_info(filename: str) -> str:
    """
    Get detailed information about each column in a loaded dataset.

    Args:
        filename: Name of a previously loaded file.

    Returns:
        Detailed column information including data types, null counts, unique values, and samples.
    """
    return _get_column_info(filename)
