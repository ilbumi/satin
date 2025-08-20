from pydantic import Field, MongoDsn
from pydantic_settings import BaseSettings


class Config(BaseSettings):
    """Configuration settings for the application."""

    mongo_dsn: MongoDsn = Field(
        validation_alias="MONGO_DSN",
        default=MongoDsn("mongodb://admin:password@localhost:27017/satin?authSource=admin"),
    )

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

    # URL validation configuration
    allow_local_urls: bool = Field(
        validation_alias="ALLOW_LOCAL_URLS",
        default=True,
        description="Allow local URLs in image validation (useful for development/testing)",
    )

    # Disable dangerous pattern checks for testing
    disable_dangerous_pattern_checks: bool = Field(
        validation_alias="DISABLE_DANGEROUS_PATTERN_CHECKS",
        default=True,
        description="Disable dangerous pattern checks in URL validation (useful for testing)",
    )


config = Config()
