from datetime import UTC, datetime

import pytest
from bson import ObjectId

from satin.models.annotation import Annotation, BBox
from satin.models.image import Image
from satin.models.project import Project
from satin.models.task import Task, TaskStatus
from satin.repositories import ImageRepository, ProjectRepository, TaskRepository
from tests.conftest import DatabaseFactory


class TestTask:
    """Test cases for Task schema."""

    def test_task_creation(self):
        """Test Task object creation."""
        image = Image(id="img123", url="https://example.com/image.jpg")
        project = Project(id="proj123", name="Test Project", description="Test")
        bbox = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=Annotation(text="test", tags=["tag1"]))

        task = Task(
            id="task123",
            image=image,
            project=project,
            bboxes=[bbox],
            status=TaskStatus.DRAFT,
            created_at=datetime.now(tz=UTC),
        )

        assert task.id == "task123"
        assert task.image.id == "img123"
        assert task.project.id == "proj123"
        assert len(task.bboxes) == 1
        assert task.status == TaskStatus.DRAFT


async def get_sample_image(image_repo):
    """Create a sample image for testing."""
    return await image_repo.create_image("https://example.com/test-image.jpg")


async def get_sample_project(project_repo):
    """Create a sample project for testing."""
    return await project_repo.create_project("Test Project", "Test Description")


@pytest.fixture
def sample_bbox():
    return BBox(
        x=10.0,
        y=20.0,
        width=100.0,
        height=200.0,
        annotation=Annotation(text="test object", tags=["object", "test"]),
    )


class TestTaskFunctions:
    """Test cases for task database functions."""

    async def test_create_task(self):
        """Test creating a new task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        image_repo = ImageRepository(db)
        project_repo = ProjectRepository(db)

        # Create dependencies
        image = await image_repo.create_image("https://example.com/image.jpg")
        project = await project_repo.create_project("Test Project", "Test Description")
        bbox = BBox(
            x=10.0,
            y=20.0,
            width=100.0,
            height=200.0,
            annotation=Annotation(text="test object", tags=["object", "test"]),
        )

        task = await task_repo.create_task(
            image_id=image.id, project_id=project.id, bboxes=[bbox], status=TaskStatus.DRAFT
        )
        assert task.image.id == image.id
        assert task.project.id == project.id
        assert len(task.bboxes) == 1
        assert task.status == TaskStatus.DRAFT
        assert task.id is not None
        assert task.created_at is not None

        # Verify it's in the database
        stored = await task_repo.db["tasks"].find_one({"_id": ObjectId(task.id)})
        assert stored is not None
        assert str(stored["image_id"]) == image.id
        assert str(stored["project_id"]) == project.id

    async def test_create_task_with_defaults(self):
        """Test creating a task with default values."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        sample_image = await get_sample_image(ImageRepository(db))
        sample_project = await get_sample_project(ProjectRepository(db))
        task = await task_repo.create_task(image_id=sample_image.id, project_id=sample_project.id)
        assert len(task.bboxes) == 0
        assert task.status == TaskStatus.DRAFT

    async def test_get_task(self, sample_bbox: BBox):
        """Test retrieving a task by ID."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        sample_image = await get_sample_image(ImageRepository(db))
        sample_project = await get_sample_project(ProjectRepository(db))
        # Create a test task
        created_task = await task_repo.create_task(
            image_id=sample_image.id, project_id=sample_project.id, bboxes=[sample_bbox], status=TaskStatus.FINISHED
        )

        # Retrieve it
        retrieved_task = await task_repo.get_task(created_task.id)

        assert retrieved_task is not None
        assert retrieved_task.id == created_task.id
        assert retrieved_task.image.id == sample_image.id
        assert retrieved_task.project.id == sample_project.id
        assert len(retrieved_task.bboxes) == 1
        assert retrieved_task.status == TaskStatus.FINISHED

    async def test_get_task_not_found(self):
        """Test retrieving a non-existent task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)

        task = await task_repo.get_task("507f1f77bcf86cd799439011")
        assert task is None

    async def test_get_all_tasks(self):
        """Test retrieving all tasks."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        image_repo = ImageRepository(db)
        project_repo = ProjectRepository(db)
        sample_image = await get_sample_image(image_repo)
        sample_project = await get_sample_project(project_repo)
        # Create multiple tasks
        await task_repo.create_task(image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.DRAFT)
        await task_repo.create_task(image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.FINISHED)
        await task_repo.create_task(image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.REVIEWED)

        # Retrieve all tasks
        tasks = await task_repo.get_all_tasks()

        assert len(tasks) == 3
        task_statuses = {t.status for t in tasks}
        assert task_statuses == {TaskStatus.DRAFT, TaskStatus.FINISHED, TaskStatus.REVIEWED}

    async def test_get_all_tasks_empty(self):
        """Test retrieving all tasks when none exist."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        tasks = await task_repo.get_all_tasks()

        assert len(tasks) == 0

    async def test_update_task(self, sample_bbox: BBox):
        """Test updating a task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        image_repo = ImageRepository(db)
        project_repo = ProjectRepository(db)
        sample_image = await get_sample_image(image_repo)
        sample_project = await get_sample_project(project_repo)
        # Create a task
        task = await task_repo.create_task(
            image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.DRAFT
        )

        # Update it
        success = await task_repo.update_task(task.id, bboxes=[sample_bbox], status=TaskStatus.FINISHED)
        assert success is True

        # Verify the update
        updated_task = await task_repo.get_task(task.id)
        assert updated_task is not None
        assert updated_task.id == task.id
        assert len(updated_task.bboxes) == 1
        assert updated_task.status == TaskStatus.FINISHED

    async def test_update_task_partial(self):
        """Test updating only some fields of a task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        image_repo = ImageRepository(db)
        project_repo = ProjectRepository(db)
        sample_image = await get_sample_image(image_repo)
        sample_project = await get_sample_project(project_repo)
        # Create a task
        task = await task_repo.create_task(
            image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.DRAFT
        )

        # Update only the status
        success = await task_repo.update_task(task.id, status=TaskStatus.FINISHED)
        assert success is True

        # Verify the update
        updated_task = await task_repo.get_task(task.id)
        assert updated_task is not None
        assert updated_task.status == TaskStatus.FINISHED
        assert updated_task.image.id == sample_image.id
        assert updated_task.project.id == sample_project.id

    async def test_update_task_not_found(self):
        """Test updating a non-existent task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        success = await task_repo.update_task("507f1f77bcf86cd799439011", status=TaskStatus.FINISHED)
        assert success is False

    async def test_update_task_no_changes(self):
        """Test updating a task with no actual changes."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        sample_image = await get_sample_image(ImageRepository(db))
        sample_project = await get_sample_project(ProjectRepository(db))
        # Create a task
        task = await task_repo.create_task(
            image_id=sample_image.id, project_id=sample_project.id, status=TaskStatus.DRAFT
        )

        # Update with no changes
        success = await task_repo.update_task(task.id)
        assert success is False  # No changes means no update

        # But the task should still exist unchanged
        updated_task = await task_repo.get_task(task.id)
        assert updated_task is not None
        assert updated_task.status == TaskStatus.DRAFT

    async def test_delete_task(self):
        """Test deleting a task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        sample_image = await get_sample_image(ImageRepository(db))
        sample_project = await get_sample_project(ProjectRepository(db))
        # Create a task
        task = await task_repo.create_task(image_id=sample_image.id, project_id=sample_project.id)

        # Delete it
        deleted = await task_repo.delete_task(task.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await task_repo.get_task(task.id)
        assert retrieved is None

    async def test_delete_task_not_found(self):
        """Test deleting a non-existent task."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        deleted = await task_repo.delete_task("507f1f77bcf86cd799439011")
        assert deleted is False

    async def test_count_all_tasks(self):
        """Test counting all tasks."""
        db, client = await DatabaseFactory.create_test_db()
        task_repo = TaskRepository(db)
        image_repo = ImageRepository(db)
        project_repo = ProjectRepository(db)

        # Initially should be 0
        count = await task_repo.count_all_tasks()
        assert count == 0

        # Create dependencies
        image = await get_sample_image(image_repo)
        project = await get_sample_project(project_repo)

        # Create some tasks
        await task_repo.create_task(image.id, project.id, status=TaskStatus.DRAFT)
        await task_repo.create_task(image.id, project.id, status=TaskStatus.FINISHED)
        await task_repo.create_task(image.id, project.id, status=TaskStatus.REVIEWED)

        # Should now be 3
        count = await task_repo.count_all_tasks()
        assert count == 3

        # Delete one task
        tasks = await task_repo.get_all_tasks()
        await task_repo.delete_task(tasks[0].id)

        # Should now be 2
        count = await task_repo.count_all_tasks()
        assert count == 2
