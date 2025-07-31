from pymongo.asynchronous.database import AsyncDatabase

from .image import ImageRepository
from .project import ProjectRepository
from .task import TaskRepository


class RepositoryFactory:
    """Factory for creating repository instances with shared database connection."""

    def __init__(self, db: AsyncDatabase):
        """Initialize the factory with a database connection."""
        self.db = db
        self._project_repo: ProjectRepository | None = None
        self._image_repo: ImageRepository | None = None
        self._task_repo: TaskRepository | None = None

    @property
    def project_repo(self) -> ProjectRepository:
        """Get or create ProjectRepository instance."""
        if self._project_repo is None:
            self._project_repo = ProjectRepository(self.db)
        return self._project_repo

    @property
    def image_repo(self) -> ImageRepository:
        """Get or create ImageRepository instance."""
        if self._image_repo is None:
            self._image_repo = ImageRepository(self.db)
        return self._image_repo

    @property
    def task_repo(self) -> TaskRepository:
        """Get or create TaskRepository instance."""
        if self._task_repo is None:
            self._task_repo = TaskRepository(self.db)
        return self._task_repo
