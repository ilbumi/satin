"""Tests for GraphQL mutations."""

import pytest
from pydantic import ValidationError

from tests.conftest import DatabaseFactory, TestDataFactory


class TestProjectMutations:
    """Test GraphQL mutations for projects."""

    async def test_create_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a project."""
        # Create test database and GraphQL client in the current event loop
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
                name
                description
            }
        }
        """

        project_input = test_data.create_project_input("New Project", "A brand new project")
        result = gql.mutate(mutation, project_input)

        project = result["createProject"]
        assert project["name"] == "New Project"
        assert project["description"] == "A brand new project"
        assert project["id"]

    async def test_update_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test updating a project."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # First create a project
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
                name
                description
            }
        }
        """

        project_input = test_data.create_project_input("Original Name", "Original Description")
        create_result = gql.mutate(create_mutation, project_input)
        project_id = create_result["createProject"]["id"]

        # Update the project
        update_mutation = """
        mutation UpdateProject($id: ID!, $name: String, $description: String) {
            updateProject(id: $id, name: $name, description: $description) {
                id
                name
                description
            }
        }
        """

        update_result = gql.mutate(
            update_mutation, {"id": project_id, "name": "Updated Name", "description": "Updated Description"}
        )

        updated_project = update_result["updateProject"]
        assert updated_project["id"] == project_id
        assert updated_project["name"] == "Updated Name"
        assert updated_project["description"] == "Updated Description"

    async def test_update_project_partial(self, monkeypatch: pytest.MonkeyPatch):
        """Test updating a project with only some fields."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create a project
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
                name
                description
            }
        }
        """

        project_input = test_data.create_project_input("Original Name", "Original Description")
        create_result = gql.mutate(create_mutation, project_input)
        project_id = create_result["createProject"]["id"]

        # Update only the name
        update_mutation = """
        mutation UpdateProject($id: ID!, $name: String) {
            updateProject(id: $id, name: $name) {
                id
                name
                description
            }
        }
        """

        update_result = gql.mutate(update_mutation, {"id": project_id, "name": "New Name Only"})

        updated_project = update_result["updateProject"]
        assert updated_project["name"] == "New Name Only"
        assert updated_project["description"] == "Original Description"  # Should remain unchanged

    async def test_delete_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test deleting a project."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create a project
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
            }
        }
        """

        project_input = test_data.create_project_input()
        create_result = gql.mutate(create_mutation, project_input)
        project_id = create_result["createProject"]["id"]

        # Delete the project
        delete_mutation = """
        mutation DeleteProject($id: ID!) {
            deleteProject(id: $id)
        }
        """

        delete_result = gql.mutate(delete_mutation, {"id": project_id})
        assert delete_result["deleteProject"] is True

        # Verify project is deleted
        query = """
        query GetProject($id: ID!) {
            project(id: $id) {
                id
            }
        }
        """

        query_result = gql.query(query, {"id": project_id})
        assert query_result["project"] is None

    async def test_delete_nonexistent_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test deleting a project that doesn't exist."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        delete_mutation = """
        mutation DeleteProject($id: ID!) {
            deleteProject(id: $id)
        }
        """

        result = gql.mutate(delete_mutation, {"id": "507f1f77bcf86cd799439011"})
        assert result["deleteProject"] is False


class TestImageMutations:
    """Test GraphQL mutations for images."""

    async def test_create_image(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating an image."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
                url
            }
        }
        """

        image_input = test_data.create_image_input("https://example.com/new-image.jpg")
        result = gql.mutate(mutation, image_input)

        image = result["createImage"]
        assert image["url"] == "https://example.com/new-image.jpg"
        assert image["id"]

    async def test_update_image(self, monkeypatch: pytest.MonkeyPatch):
        """Test updating an image."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create an image
        create_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
                url
            }
        }
        """

        image_input = test_data.create_image_input("https://example.com/original.jpg")
        create_result = gql.mutate(create_mutation, image_input)
        image_id = create_result["createImage"]["id"]

        # Update the image
        update_mutation = """
        mutation UpdateImage($id: ID!, $url: String) {
            updateImage(id: $id, url: $url) {
                id
                url
            }
        }
        """

        update_result = gql.mutate(update_mutation, {"id": image_id, "url": "https://example.com/updated.jpg"})

        updated_image = update_result["updateImage"]
        assert updated_image["id"] == image_id
        assert updated_image["url"] == "https://example.com/updated.jpg"

    async def test_delete_image(self, monkeypatch: pytest.MonkeyPatch):
        """Test deleting an image."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create an image
        create_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
            }
        }
        """

        image_input = test_data.create_image_input()
        create_result = gql.mutate(create_mutation, image_input)
        image_id = create_result["createImage"]["id"]

        # Delete the image
        delete_mutation = """
        mutation DeleteImage($id: ID!) {
            deleteImage(id: $id)
        }
        """

        delete_result = gql.mutate(delete_mutation, {"id": image_id})
        assert delete_result["deleteImage"] is True

        # Verify image is deleted
        query = """
        query GetImage($id: ID!) {
            image(id: $id) {
                id
            }
        }
        """

        query_result = gql.query(query, {"id": image_id})
        assert query_result["image"] is None


class TestTaskMutations:
    """Test GraphQL mutations for tasks."""

    @staticmethod
    async def set_up_dependencies(monkeypatch: pytest.MonkeyPatch):
        """Create project and image for task tests."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create project
        create_project_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
            }
        }
        """

        project_result = gql.mutate(
            create_project_mutation, test_data.create_project_input("Task Project", "For task testing")
        )
        project_id = project_result["createProject"]["id"]

        # Create image
        create_image_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
            }
        }
        """

        image_result = gql.mutate(
            create_image_mutation, test_data.create_image_input("https://example.com/task-image.jpg")
        )
        image_id = image_result["createImage"]["id"]

        return {"project_id": project_id, "image_id": image_id}

    async def test_create_task(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a task."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $bboxes: [BBoxInput!], $status: TaskStatus!) {
            createTask(imageId: $imageId, projectId: $projectId, bboxes: $bboxes, status: $status) {
                id
                status
                image {
                    id
                    url
                }
                project {
                    id
                    name
                }
                bboxes {
                    x
                    y
                    width
                    height
                    annotation {
                        text
                        tags
                    }
                }
                createdAt
            }
        }
        """

        task_input = test_data.create_task_input(deps["image_id"], deps["project_id"], status="FINISHED")
        result = gql.mutate(mutation, task_input)

        task = result["createTask"]
        assert task["status"] == "FINISHED"
        assert task["image"]["id"] == deps["image_id"]
        assert task["project"]["id"] == deps["project_id"]
        assert len(task["bboxes"]) == 1
        assert task["bboxes"][0]["annotation"]["text"] == "test object"
        assert task["createdAt"]

    async def test_create_task_minimal(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a task with minimal data."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!) {
            createTask(imageId: $imageId, projectId: $projectId) {
                id
                status
                bboxes {
                    x
                    y
                }
            }
        }
        """

        result = gql.mutate(mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"]})

        task = result["createTask"]
        assert task["status"] == "DRAFT"  # Default status
        assert task["bboxes"] == []  # Default empty list

    async def test_create_task_with_complex_bboxes(
        self,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Test creating a task with multiple complex bounding boxes."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $bboxes: [BBoxInput!]!) {
            createTask(imageId: $imageId, projectId: $projectId, bboxes: $bboxes) {
                id
                bboxes {
                    x
                    y
                    width
                    height
                    annotation {
                        text
                        tags
                    }
                }
            }
        }
        """

        # Create multiple bboxes with different annotations
        bboxes = [
            test_data.create_bbox_input(
                10, 20, 100, 200, test_data.create_annotation_input("person", ["human", "person"])
            ),
            test_data.create_bbox_input(50, 60, 80, 120, test_data.create_annotation_input("car", ["vehicle", "car"])),
        ]

        result = gql.mutate(mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"], "bboxes": bboxes})

        task = result["createTask"]
        assert len(task["bboxes"]) == 2

        # Verify first bbox
        bbox1 = task["bboxes"][0]
        assert bbox1["x"] == 10
        assert bbox1["annotation"]["text"] == "person"
        assert "human" in bbox1["annotation"]["tags"]

        # Verify second bbox
        bbox2 = task["bboxes"][1]
        assert bbox2["x"] == 50
        assert bbox2["annotation"]["text"] == "car"
        assert "vehicle" in bbox2["annotation"]["tags"]

    async def test_update_task(self, monkeypatch: pytest.MonkeyPatch):
        """Test updating a task."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        # Create a task first
        create_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $status: TaskStatus!) {
            createTask(imageId: $imageId, projectId: $projectId, status: $status) {
                id
                status
            }
        }
        """

        create_result = gql.mutate(
            create_mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"], "status": "DRAFT"}
        )
        task_id = create_result["createTask"]["id"]

        # Update the task
        update_mutation = """
        mutation UpdateTask($id: ID!, $status: TaskStatus, $bboxes: [BBoxInput!]) {
            updateTask(id: $id, status: $status, bboxes: $bboxes) {
                id
                status
                bboxes {
                    x
                    y
                    annotation {
                        text
                    }
                }
            }
        }
        """

        new_bbox = test_data.create_bbox_input(
            x=100, y=200, width=50, height=75, annotation=test_data.create_annotation_input("updated object")
        )

        update_result = gql.mutate(update_mutation, {"id": task_id, "status": "REVIEWED", "bboxes": [new_bbox]})

        updated_task = update_result["updateTask"]
        assert updated_task["id"] == task_id
        assert updated_task["status"] == "REVIEWED"
        assert len(updated_task["bboxes"]) == 1
        assert updated_task["bboxes"][0]["x"] == 100
        assert updated_task["bboxes"][0]["annotation"]["text"] == "updated object"

    async def test_update_task_status_only(self, monkeypatch: pytest.MonkeyPatch):
        """Test updating only task status."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        # Create a task
        create_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!) {
            createTask(imageId: $imageId, projectId: $projectId) {
                id
                status
            }
        }
        """

        create_result = gql.mutate(create_mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"]})
        task_id = create_result["createTask"]["id"]

        # Update only status
        update_mutation = """
        mutation UpdateTask($id: ID!, $status: TaskStatus!) {
            updateTask(id: $id, status: $status) {
                id
                status
            }
        }
        """

        update_result = gql.mutate(update_mutation, {"id": task_id, "status": "FINISHED"})

        updated_task = update_result["updateTask"]
        assert updated_task["status"] == "FINISHED"

    async def test_delete_task(self, monkeypatch: pytest.MonkeyPatch):
        """Test deleting a task."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        # Create a task
        create_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!) {
            createTask(imageId: $imageId, projectId: $projectId) {
                id
            }
        }
        """

        create_result = gql.mutate(create_mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"]})
        task_id = create_result["createTask"]["id"]

        # Delete the task
        delete_mutation = """
        mutation DeleteTask($id: ID!) {
            deleteTask(id: $id)
        }
        """

        delete_result = gql.mutate(delete_mutation, {"id": task_id})
        assert delete_result["deleteTask"] is True

        # Verify task is deleted
        query = """
        query GetTask($id: ID!) {
            task(id: $id) {
                id
            }
        }
        """

        query_result = gql.query(query, {"id": task_id})
        assert query_result["task"] is None

    async def test_task_status_enum_validation(self, monkeypatch: pytest.MonkeyPatch):
        """Test that TaskStatus enum values are properly validated."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        deps = await TestTaskMutations.set_up_dependencies(monkeypatch)

        mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $status: TaskStatus!) {
            createTask(imageId: $imageId, projectId: $projectId, status: $status) {
                id
                status
            }
        }
        """

        # Test valid enum values
        valid_statuses = ["DRAFT", "FINISHED", "REVIEWED"]

        for status in valid_statuses:
            result = gql.mutate(
                mutation, {"imageId": deps["image_id"], "projectId": deps["project_id"], "status": status}
            )

            task = result["createTask"]
            assert task["status"] == status

    async def test_create_task_invalid_references(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a task with invalid project/image references."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        # First create a task with invalid references
        create_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!) {
            createTask(imageId: $imageId, projectId: $projectId) {
                id
            }
        }
        """

        with pytest.raises(ValidationError):
            gql.mutate(
                create_mutation, {"imageId": "507f1f77bcf86cd799439011", "projectId": "507f1f77bcf86cd799439012"}
            )
