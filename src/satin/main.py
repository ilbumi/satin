from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from satin.config import get_settings

settings = get_settings()

app = FastAPI(title="Satin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Hello from Satin API!"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
