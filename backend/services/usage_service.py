"""
Usage tracking service for monitoring API usage and enforcing limits.
"""

from datetime import datetime, timezone
from supabase import create_client
from core.config import settings


class UsageService:
    """Service for tracking and managing user usage."""

    # Free tier limits
    DAILY_MESSAGE_LIMIT = 50
    DAILY_FILE_UPLOAD_LIMIT = 10

    def __init__(self):
        """Initialize usage service with Supabase client."""
        self.supabase = None
        if settings.supabase_url and settings.supabase_service_key:
            # Use service key for writing usage (bypasses RLS)
            self.supabase = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )

    async def track_usage(
        self,
        user_id: str,
        action: str,
        tokens_used: int = 0,
        metadata: dict = None
    ) -> bool:
        """
        Track a usage event.

        Args:
            user_id: The user's ID
            action: Type of action ('chat_message', 'file_upload', 'chart_generated')
            tokens_used: Number of tokens used (for chat messages)
            metadata: Additional metadata (conversation_id, file_id, etc.)

        Returns:
            True if tracked successfully, False otherwise
        """
        if not self.supabase:
            print("Usage tracking disabled: Supabase not configured")
            return False

        try:
            result = self.supabase.table("usage").insert({
                "user_id": user_id,
                "action": action,
                "tokens_used": tokens_used,
                "metadata": metadata or {}
            }).execute()

            return len(result.data) > 0

        except Exception as e:
            print(f"Failed to track usage: {e}")
            return False

    async def get_daily_usage(self, user_id: str) -> dict:
        """
        Get user's usage for today.

        Returns:
            dict with message_count, upload_count, tokens_used
        """
        if not self.supabase:
            return {"message_count": 0, "upload_count": 0, "tokens_used": 0}

        try:
            # Get today's date range
            today = datetime.now(timezone.utc).date()
            start_of_day = f"{today}T00:00:00Z"
            end_of_day = f"{today}T23:59:59Z"

            result = self.supabase.table("usage").select("action, tokens_used").eq(
                "user_id", user_id
            ).gte(
                "created_at", start_of_day
            ).lte(
                "created_at", end_of_day
            ).execute()

            # Count by action type
            message_count = 0
            upload_count = 0
            total_tokens = 0

            for row in result.data:
                if row["action"] == "chat_message":
                    message_count += 1
                elif row["action"] == "file_upload":
                    upload_count += 1
                total_tokens += row.get("tokens_used", 0)

            return {
                "message_count": message_count,
                "upload_count": upload_count,
                "tokens_used": total_tokens,
                "message_limit": self.DAILY_MESSAGE_LIMIT,
                "upload_limit": self.DAILY_FILE_UPLOAD_LIMIT,
            }

        except Exception as e:
            print(f"Failed to get daily usage: {e}")
            return {"message_count": 0, "upload_count": 0, "tokens_used": 0}

    async def check_message_limit(self, user_id: str) -> tuple[bool, int]:
        """
        Check if user has reached their daily message limit.

        Returns:
            Tuple of (can_send, remaining_messages)
        """
        usage = await self.get_daily_usage(user_id)
        remaining = self.DAILY_MESSAGE_LIMIT - usage["message_count"]
        can_send = remaining > 0
        return can_send, max(0, remaining)

    async def check_upload_limit(self, user_id: str) -> tuple[bool, int]:
        """
        Check if user has reached their daily upload limit.

        Returns:
            Tuple of (can_upload, remaining_uploads)
        """
        usage = await self.get_daily_usage(user_id)
        remaining = self.DAILY_FILE_UPLOAD_LIMIT - usage["upload_count"]
        can_upload = remaining > 0
        return can_upload, max(0, remaining)

    async def get_monthly_usage(self, user_id: str) -> dict:
        """
        Get user's usage for the current month.

        Returns:
            dict with total counts and daily breakdown
        """
        if not self.supabase:
            return {"total_messages": 0, "total_tokens": 0, "daily_breakdown": []}

        try:
            # Get first day of current month
            today = datetime.now(timezone.utc)
            first_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            start_of_month = first_of_month.isoformat()

            result = self.supabase.table("usage").select(
                "action, tokens_used, created_at"
            ).eq(
                "user_id", user_id
            ).gte(
                "created_at", start_of_month
            ).order("created_at").execute()

            # Aggregate data
            total_messages = 0
            total_tokens = 0
            daily_counts = {}

            for row in result.data:
                if row["action"] == "chat_message":
                    total_messages += 1
                total_tokens += row.get("tokens_used", 0)

                # Group by date
                date_str = row["created_at"][:10]
                if date_str not in daily_counts:
                    daily_counts[date_str] = {"messages": 0, "tokens": 0}
                if row["action"] == "chat_message":
                    daily_counts[date_str]["messages"] += 1
                daily_counts[date_str]["tokens"] += row.get("tokens_used", 0)

            return {
                "total_messages": total_messages,
                "total_tokens": total_tokens,
                "daily_breakdown": [
                    {"date": date, **counts}
                    for date, counts in sorted(daily_counts.items())
                ]
            }

        except Exception as e:
            print(f"Failed to get monthly usage: {e}")
            return {"total_messages": 0, "total_tokens": 0, "daily_breakdown": []}


# Singleton instance
usage_service = UsageService()
