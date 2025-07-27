import pytest
from bson import ObjectId

from satin.schema.project import (
    Project,
    create_project,
    delete_project,
    get_all_projects,
    get_project,
    update_project,
)


class TestProject:
    """Test cases for Project schema and functions."""

    def test_project_creation(self):
        """Test Project object creation."""
        project = Project(id="123", name="Test Project", description="A test project")
        assert project.id == "123"
        assert project.name == "Test Project"
        assert project.description == "A test project"

    def test_project_str_representation(self):
        """Test Project string representation."""
        project = Project(id="123", name="Test Project", description="A test project")
        expected = "Project(id=123, name=Test Project, description=A test project)"
        assert str(project) == expected


class TestProjectFunctions:
    """Test cases for project database functions."""

    @pytest.mark.asyncio
    async def test_create_project(self, test_db, monkeypatch):
        """Test creating a new project."""
        # Mock the db object
        monkeypatch.setattr("satin.schema.project.db", test_db)

        project = await create_project("Test Project", "A test description")

        assert project.name == "Test Project"
        assert project.description == "A test description"
        assert project.id is not None

        # Verify it's in the database
        stored = await test_db["projects"].find_one({"_id": ObjectId(project.id)})
        assert stored is not None
        assert stored["name"] == "Test Project"
        assert stored["description"] == "A test description"

    @pytest.mark.asyncio
    async def test_create_project_with_default_description(self, test_db, monkeypatch):
        """Test creating a project with default empty description."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        project = await create_project("Test Project", "")

        assert project.name == "Test Project"
        assert project.description == ""

    @pytest.mark.asyncio
    async def test_get_project(self, test_db, monkeypatch):
        """Test retrieving a project by ID."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create a test project
        created_project = await create_project("Test Project", "Test description")

        # Retrieve it
        retrieved_project = await get_project(created_project.id)

        assert retrieved_project is not None
        assert retrieved_project.id == created_project.id
        assert retrieved_project.name == "Test Project"
        assert retrieved_project.description == "Test description"

    @pytest.mark.asyncio
    async def test_get_project_not_found(self, test_db, monkeypatch):
        """Test retrieving a non-existent project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        project = await get_project("507f1f77bcf86cd799439011")
        assert project is None

    @pytest.mark.asyncio
    async def test_get_all_projects(self, test_db, monkeypatch):
        """Test retrieving all projects."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create multiple projects
        await create_project("Project 1", "Description 1")
        await create_project("Project 2", "Description 2")
        await create_project("Project 3", "Description 3")

        # Retrieve all projects
        projects = await get_all_projects()

        assert len(projects) == 3
        project_names = {p.name for p in projects}
        assert project_names == {"Project 1", "Project 2", "Project 3"}

    @pytest.mark.asyncio
    async def test_get_all_projects_empty(self, test_db, monkeypatch):
        """Test retrieving all projects when none exist."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        projects = await get_all_projects()

        assert len(projects) == 0

    @pytest.mark.asyncio
    async def test_update_project(self, test_db, monkeypatch):
        """Test updating a project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create a project
        project = await create_project("Original Name", "Original Description")

        # Update it
        updated_project = await update_project(project.id, name="Updated Name", description="Updated Description")

        assert updated_project is not None
        assert updated_project.id == project.id
        assert updated_project.name == "Updated Name"
        assert updated_project.description == "Updated Description"

    @pytest.mark.asyncio
    async def test_update_project_partial(self, test_db, monkeypatch):
        """Test updating only some fields of a project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create a project
        project = await create_project("Original Name", "Original Description")

        # Update only the name
        updated_project = await update_project(project.id, name="Updated Name")

        assert updated_project is not None
        assert updated_project.name == "Updated Name"
        assert updated_project.description == "Original Description"

    @pytest.mark.asyncio
    async def test_update_project_not_found(self, test_db, monkeypatch):
        """Test updating a non-existent project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        updated_project = await update_project("507f1f77bcf86cd799439011", name="Updated Name")
        assert updated_project is None

    @pytest.mark.asyncio
    async def test_update_project_no_changes(self, test_db, monkeypatch):
        """Test updating a project with no actual changes."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create a project
        project = await create_project("Test Name", "Test Description")

        # Update with no changes
        updated_project = await update_project(project.id)

        assert updated_project is not None
        assert updated_project.name == "Test Name"
        assert updated_project.description == "Test Description"

    @pytest.mark.asyncio
    async def test_delete_project(self, test_db, monkeypatch):
        """Test deleting a project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        # Create a project
        project = await create_project("Test Project", "Test Description")

        # Delete it
        deleted = await delete_project(project.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await get_project(project.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_project_not_found(self, test_db, monkeypatch):
        """Test deleting a non-existent project."""
        monkeypatch.setattr("satin.schema.project.db", test_db)

        deleted = await delete_project("507f1f77bcf86cd799439011")
        assert deleted is False
