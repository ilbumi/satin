import uvicorn

from satin.config import get_settings


def main() -> None:
    """Run the FastAPI application."""
    settings = get_settings()
    uvicorn.run(
        "satin.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.reload,
    )
