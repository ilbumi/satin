from pydantic import Field, MongoDsn
from pydantic_settings import BaseSettings


class Config(BaseSettings):
    """Configuration settings for the application."""

    mongo_dsn: MongoDsn = Field(validation_alias="MONGO_DSN", default="mongodb://mongo:27107/satin")


config = Config()
