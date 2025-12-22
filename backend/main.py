from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from core.config import settings
from api.routes import health_router, agent_router, files_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown."""
    # Startup
    print(f"Starting {settings.app_name}...")

    # Create directories
    Path("user_data").mkdir(exist_ok=True)
    Path("user_output").mkdir(exist_ok=True)

    yield

    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="API for the Data Analysis Agent - analyze data with natural language",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow frontend URLs
cors_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Add production URLs if FRONTEND_URL is set to production
if settings.frontend_url and settings.frontend_url.startswith("https://"):
    cors_origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(agent_router)
app.include_router(files_router)

# Serve static files (for charts)
output_dir = Path(__file__).parent.parent / "output"
if output_dir.exists():
    app.mount("/output", StaticFiles(directory=str(output_dir)), name="output")


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
