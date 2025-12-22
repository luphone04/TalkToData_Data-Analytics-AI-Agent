from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Get the project root directory (parent of backend/)
PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # OpenAI
    openai_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # App settings
    app_name: str = "Data Analysis Agent API"
    debug: bool = False
    frontend_url: str = "http://localhost:3000"

    # File storage
    max_file_size_mb: int = 10
    allowed_extensions: list[str] = ["csv", "xlsx", "xls"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
