from bson import ObjectId

from satin.models.project import Project
from satin.repositories import ProjectRepository
from tests.conftest import DatabaseFactory


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

    async def test_create_project(self):
        """Test creating a new project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        project = await project_repo.create_project("Test Project", "A test description")

        assert project.name == "Test Project"
        assert project.description == "A test description"
        assert project.id is not None

        # Verify it's in the database
        stored = await project_repo.db["projects"].find_one({"_id": ObjectId(project.id)})
        assert stored is not None
        assert stored["name"] == "Test Project"
        assert stored["description"] == "A test description"

    async def test_create_project_with_default_description(self):
        """Test creating a project with default empty description."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        project = await project_repo.create_project("Test Project", "")

        assert project.name == "Test Project"
        assert project.description == ""

    async def test_get_project(self):
        """Test retrieving a project by ID."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create a test project
        created_project = await project_repo.create_project("Test Project", "Test description")

        # Retrieve it
        retrieved_project = await project_repo.get_project(created_project.id)

        assert retrieved_project is not None
        assert retrieved_project.id == created_project.id
        assert retrieved_project.name == "Test Project"
        assert retrieved_project.description == "Test description"

    async def test_get_project_not_found(self):
        """Test retrieving a non-existent project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        project = await project_repo.get_project("507f1f77bcf86cd799439011")
        assert project is None

    async def test_get_all_projects(self):
        """Test retrieving all projects."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create multiple projects
        await project_repo.create_project("Project 1", "Description 1")
        await project_repo.create_project("Project 2", "Description 2")
        await project_repo.create_project("Project 3", "Description 3")

        # Retrieve all projects
        projects = await project_repo.get_all_projects()

        assert len(projects) == 3
        project_names = {p.name for p in projects}
        assert project_names == {"Project 1", "Project 2", "Project 3"}

    async def test_get_all_projects_empty(self):
        """Test retrieving all projects when none exist."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        projects = await project_repo.get_all_projects()

        assert len(projects) == 0

    async def test_update_project(self):
        """Test updating a project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create a project
        project = await project_repo.create_project("Original Name", "Original Description")

        # Update it
        success = await project_repo.update_project(project.id, name="Updated Name", description="Updated Description")
        updated_project = await project_repo.get_project(project.id) if success else None

        assert success is True
        assert updated_project is not None
        assert updated_project.id == project.id
        assert updated_project.name == "Updated Name"
        assert updated_project.description == "Updated Description"

    async def test_update_project_partial(self):
        """Test updating only some fields of a project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create a project
        project = await project_repo.create_project("Original Name", "Original Description")

        # Update only the name
        success = await project_repo.update_project(project.id, name="Updated Name")
        updated_project = await project_repo.get_project(project.id) if success else None

        assert success is True
        assert updated_project is not None
        assert updated_project.name == "Updated Name"
        assert updated_project.description == "Original Description"

    async def test_update_project_not_found(self):
        """Test updating a non-existent project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        success = await project_repo.update_project("507f1f77bcf86cd799439011", name="Updated Name")
        assert success is False

    async def test_update_project_no_changes(self):
        """Test updating a project with no actual changes."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create a project
        project = await project_repo.create_project("Test Name", "Test Description")

        # Update with no changes
        success = await project_repo.update_project(project.id)

        assert success

        # But the project should still exist unchanged
        updated_project = await project_repo.get_project(project.id)
        assert updated_project is not None
        assert updated_project.name == "Test Name"
        assert updated_project.description == "Test Description"

    async def test_delete_project(self):
        """Test deleting a project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Create a project
        project = await project_repo.create_project("Test Project", "Test Description")

        # Delete it
        deleted = await project_repo.delete_project(project.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await project_repo.get_project(project.id)
        assert retrieved is None

    async def test_delete_project_not_found(self):
        """Test deleting a non-existent project."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        deleted = await project_repo.delete_project("507f1f77bcf86cd799439011")
        assert deleted is False

    async def test_count_all_projects(self):
        """Test counting all projects."""
        db, client = await DatabaseFactory.create_test_db()
        project_repo = ProjectRepository(db)

        # Initially should be 0
        count = await project_repo.count_all_projects()
        assert count == 0

        # Create some projects
        await project_repo.create_project("Project 1", "Description 1")
        await project_repo.create_project("Project 2", "Description 2")
        await project_repo.create_project("Project 3", "Description 3")

        # Should now be 3
        count = await project_repo.count_all_projects()
        assert count == 3

        # Delete one project
        projects = await project_repo.get_all_projects()
        await project_repo.delete_project(projects[0].id)

        # Should now be 2
        count = await project_repo.count_all_projects()
        assert count == 2
