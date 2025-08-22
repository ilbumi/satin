from pydantic import Field, MongoDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    mongo_dsn: MongoDsn = Field()

    backend_host: str = Field(default="localhost")
    backend_port: int = Field(default=8000)
    reload: bool = Field(default=False)

    cors: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    model_config = SettingsConfigDict(env_prefix="SATIN_", env_file=".env", env_file_encoding="utf-8", extra="ignore")


def get_settings() -> AppSettings:
    """Get application settings."""
    return AppSettings()  # type: ignore[call-arg]
