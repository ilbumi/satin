from asyncio import AbstractEventLoop
from datetime import UTC, datetime

import pytest
from bson import ObjectId

from satin.schema.annotation import Annotation, BBox
from satin.schema.image import Image, create_image
from satin.schema.project import Project, create_project
from satin.schema.task import (
    Task,
    create_task,
    delete_task,
    get_all_tasks,
    get_task,
    update_task,
)


class TestTask:
    """Test cases for Task schema."""

    def test_task_creation(self):
        """Test Task object creation."""
        image = Image(id="img123", url="https://example.com/image.jpg")
        project = Project(id="proj123", name="Test Project", description="Test")
        bbox = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=Annotation(text="test", tags=["tag1"]))

        task = Task(
            id="task123", image=image, project=project, bboxes=[bbox], status="draft", created_at=datetime.now(tz=UTC)
        )

        assert task.id == "task123"
        assert task.image.id == "img123"
        assert task.project.id == "proj123"
        assert len(task.bboxes) == 1
        assert task.status == "draft"


@pytest.fixture
def sample_image(test_db, event_loop: AbstractEventLoop, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("satin.schema.image.db", test_db)
    return event_loop.run_until_complete(create_image("https://example.com/test-image.jpg"))


@pytest.fixture
def sample_project(test_db, event_loop: AbstractEventLoop, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("satin.schema.project.db", test_db)
    return event_loop.run_until_complete(create_project("Test Project", "Test Description"))


@pytest.fixture
def sample_bbox():
    return BBox(
        x=10.0,
        y=20.0,
        width=100.0,
        height=200.0,
        annotation=Annotation(text="test object", tags=["object", "test"]),
    )


@pytest.mark.asyncio
class TestTaskFunctions:
    """Test cases for task database functions."""

    async def test_create_task(
        self,
        test_db,
        monkeypatch: pytest.MonkeyPatch,
        sample_image: Image,
        sample_project: Project,
        sample_bbox: BBox,
    ):
        """Test creating a new task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)
        task = await create_task(
            image_id=sample_image.id, project_id=sample_project.id, bboxes=[sample_bbox], status="draft"
        )
        assert task.image.id == sample_image.id
        assert task.project.id == sample_project.id
        assert len(task.bboxes) == 1
        assert task.status == "draft"
        assert task.id is not None
        assert task.created_at is not None

        # Verify it's in the database
        stored = await test_db["tasks"].find_one({"_id": ObjectId(task.id)})
        assert stored is not None
        assert str(stored["image_id"]) == sample_image.id
        assert str(stored["project_id"]) == sample_project.id

    async def test_create_task_with_defaults(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project
    ):
        """Test creating a task with default values."""
        monkeypatch.setattr("satin.schema.task.db", test_db)
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id)
        assert len(task.bboxes) == 0
        assert task.status == "draft"

    async def test_get_task(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project, sample_bbox: BBox
    ):
        """Test retrieving a task by ID."""
        monkeypatch.setattr("satin.schema.task.db", test_db)
        # Create a test task
        created_task = await create_task(
            image_id=sample_image.id, project_id=sample_project.id, bboxes=[sample_bbox], status="finished"
        )

        # Retrieve it
        retrieved_task = await get_task(created_task.id)

        assert retrieved_task is not None
        assert retrieved_task.id == created_task.id
        assert retrieved_task.image.id == sample_image.id
        assert retrieved_task.project.id == sample_project.id
        assert len(retrieved_task.bboxes) == 1
        assert retrieved_task.status == "finished"

    async def test_get_task_not_found(self, test_db, monkeypatch: pytest.MonkeyPatch):
        """Test retrieving a non-existent task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        task = await get_task("507f1f77bcf86cd799439011")
        assert task is None

    async def test_get_all_tasks(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project
    ):
        """Test retrieving all tasks."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        # Create multiple tasks
        await create_task(sample_image.id, sample_project.id, status="draft")
        await create_task(sample_image.id, sample_project.id, status="finished")
        await create_task(sample_image.id, sample_project.id, status="reviewed")

        # Retrieve all tasks
        tasks = [task async for task in get_all_tasks()]

        assert len(tasks) == 3
        task_statuses = {t.status for t in tasks}
        assert task_statuses == {"draft", "finished", "reviewed"}

    async def test_get_all_tasks_empty(self, test_db, monkeypatch: pytest.MonkeyPatch):
        """Test retrieving all tasks when none exist."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        tasks = [task async for task in get_all_tasks()]

        assert len(tasks) == 0

    async def test_update_task(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_bbox: BBox, sample_image: Image, sample_project: Project
    ):
        """Test updating a task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)
        # Create a task
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id, status="draft")

        # Update it
        updated_task = await update_task(task.id, bboxes=[sample_bbox], status="finished")

        assert updated_task is not None
        assert updated_task.id == task.id
        assert len(updated_task.bboxes) == 1
        assert updated_task.status == "finished"

    async def test_update_task_partial(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project
    ):
        """Test updating only some fields of a task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        # Create a task
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id, status="draft")

        # Update only the status
        updated_task = await update_task(task.id, status="finished")

        assert updated_task is not None
        assert updated_task.status == "finished"
        assert updated_task.image.id == sample_image.id
        assert updated_task.project.id == sample_project.id

    async def test_update_task_not_found(self, test_db, monkeypatch: pytest.MonkeyPatch):
        """Test updating a non-existent task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        updated_task = await update_task("507f1f77bcf86cd799439011", status="finished")
        assert updated_task is None

    async def test_update_task_no_changes(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project
    ):
        """Test updating a task with no actual changes."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        # Create a task
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id, status="draft")

        # Update with no changes
        updated_task = await update_task(task.id)

        assert updated_task is not None
        assert updated_task.status == "draft"

    async def test_delete_task(
        self, test_db, monkeypatch: pytest.MonkeyPatch, sample_image: Image, sample_project: Project
    ):
        """Test deleting a task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        # Create a task
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id)

        # Delete it
        deleted = await delete_task(task.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await get_task(task.id)
        assert retrieved is None

    async def test_delete_task_not_found(
        self, test_db, sample_image: Image, sample_project: Project, monkeypatch: pytest.MonkeyPatch
    ):
        """Test deleting a non-existent task."""
        monkeypatch.setattr("satin.schema.task.db", test_db)

        deleted = await delete_task("507f1f77bcf86cd799439011")
        assert deleted is False
        task = await create_task(image_id=sample_image.id, project_id=sample_project.id)

        # Delete it
        deleted = await delete_task(task.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await get_task(task.id)
        assert retrieved is None
