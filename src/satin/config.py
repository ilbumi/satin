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

    # Rate limiting configuration
    disable_rate_limiting: bool = Field(
        validation_alias="DISABLE_RATE_LIMITING",
        default=False,
        description="Disable rate limiting (useful for testing)",
    )

    # File upload configuration
    upload_directory: str = Field(
        validation_alias="UPLOAD_DIRECTORY",
        default="uploads",
        description="Directory to store uploaded files",
    )

    max_file_size: int = Field(
        validation_alias="MAX_FILE_SIZE",
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum file size in bytes",
    )

    base_url: str = Field(
        validation_alias="BASE_URL",
        default="http://localhost:8000",
        description="Base URL for generating file URLs",
    )


config = Config()
