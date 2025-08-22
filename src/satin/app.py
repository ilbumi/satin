import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from satin.config import get_settings
from satin.database import check_database_health, get_database_client

settings = get_settings()

# Initialize FastAPI application
app = FastAPI(title="Satin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database client
db_client = get_database_client(str(settings.mongo_dsn))


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Hello from Satin API!"}


@app.get("/health")
async def health_check() -> dict[str, str | bool]:
    """Health check endpoint."""
    db_healthy = await check_database_health(db_client)
    status = "healthy" if db_healthy else "unhealthy"

    return {
        "status": status,
        "database": db_healthy,
    }


def main() -> None:
    """Run the FastAPI application."""
    settings = get_settings()
    uvicorn.run(
        "satin.app:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.reload,
    )
