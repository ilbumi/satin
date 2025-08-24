"""Dependency injection for the application."""

from threading import Lock
from typing import Self

from satin.config import AppSettings
from satin.config.settings import get_settings
from satin.database import get_database_client
from satin.repositories.annotation import AnnotationRepository
from satin.repositories.image import ImageRepository
from satin.repositories.ml_job import MLJobRepository
from satin.repositories.tag import TagRepository


class Dependencies:
    """Application dependencies container."""

    _instance = None
    _lock = Lock()

    def __new__(cls, *args, **kwargs) -> Self:  # noqa: ARG004
        """Ensure a single instance of Dependencies."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance

    def __init__(self, settings: AppSettings):
        """Initialize application dependencies."""
        self.settings = settings
        self.db_client = get_database_client(str(settings.mongo_dsn))
        self.db = self.db_client.get_default_database()

        # Initialize repositories once
        self.image_repo = ImageRepository(self.db)
        self.annotation_repo = AnnotationRepository(self.db)
        self.tag_repo = TagRepository(self.db)
        self.ml_job_repo = MLJobRepository(self.db)


dependencies = Dependencies(get_settings())
