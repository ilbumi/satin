from pydantic import Field, MongoDsn
from pydantic_settings import BaseSettings


class Config(BaseSettings):
    """Configuration settings for the application."""

    mongo_dsn: MongoDsn = Field(validation_alias="MONGO_DSN", default=MongoDsn("mongodb://localhost:27017/satin"))

    # CORS configuration
    cors_origins: list[str] = Field(
        validation_alias="CORS_ORIGINS",
        default=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:3000",  # Alternative frontend port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
    )


config = Config()
