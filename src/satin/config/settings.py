from pydantic import Field, MongoDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    mongo_dsn: MongoDsn

    backend_host: str = "localhost"
    backend_port: int = 8000
    reload: bool = False

    cors: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    model_config = SettingsConfigDict(env_prefix="SATIN")


def get_settings() -> AppSettings:
    return AppSettings()
