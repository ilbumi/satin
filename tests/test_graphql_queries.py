"""Tests for GraphQL queries."""

import pytest

from tests.conftest import DatabaseFactory, TestDataFactory


class TestProjectQueries:
    """Test GraphQL queries for projects."""

    async def test_create_and_query_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a project and querying it back."""
        # Create test database and GraphQL client in the current event loop
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

        project_input = test_data.create_project_input("My Project", "A test project")
        result = gql.mutate(create_mutation, project_input)

        created_project = result["createProject"]
        assert created_project["name"] == "My Project"
        assert created_project["description"] == "A test project"
        assert created_project["id"]

        project_id = created_project["id"]

        # Query single project
        query = """
        query GetProject($id: ID!) {
            project(id: $id) {
                id
                name
                description
            }
        }
        """

        result = gql.query(query, {"id": project_id})
        project = result["project"]

        assert project["id"] == project_id
        assert project["name"] == "My Project"
        assert project["description"] == "A test project"

    async def test_query_nonexistent_project(self, monkeypatch: pytest.MonkeyPatch):
        """Test querying a project that doesn't exist."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query GetProject($id: ID!) {
            project(id: $id) {
                id
                name
                description
            }
        }
        """

        result = gql.query(query, {"id": "507f1f77bcf86cd799439011"})
        assert result["project"] is None

    async def test_query_projects_pagination(self, monkeypatch: pytest.MonkeyPatch):
        """Test paginated projects query."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create multiple projects
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
                name
            }
        }
        """

        for i in range(5):
            project_input = test_data.create_project_input(f"Project {i}", f"Description {i}")
            gql.mutate(create_mutation, project_input)

        # Query with pagination
        query = """
        query GetProjects($limit: Int!, $offset: Int!) {
            projects(limit: $limit, offset: $offset) {
                objects {
                    id
                    name
                    description
                }
                totalCount
                count
                limit
                offset
                hasMore
            }
        }
        """

        # First page
        result = gql.query(query, {"limit": 3, "offset": 0})
        projects_page = result["projects"]

        assert len(projects_page["objects"]) == 3
        assert projects_page["count"] == 3
        assert projects_page["totalCount"] == 5
        assert projects_page["limit"] == 3
        assert projects_page["offset"] == 0
        assert projects_page["hasMore"] is True

        # Second page
        result = gql.query(query, {"limit": 3, "offset": 3})
        projects_page = result["projects"]

        assert len(projects_page["objects"]) == 2
        assert projects_page["count"] == 2
        assert projects_page["totalCount"] == 5
        assert projects_page["limit"] == 3
        assert projects_page["offset"] == 3
        assert projects_page["hasMore"] is False

    async def test_query_projects_empty(self, monkeypatch: pytest.MonkeyPatch):
        """Test querying projects when none exist."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query GetProjects {
            projects {
                objects {
                    id
                    name
                }
                totalCount
                count
                hasMore
            }
        }
        """

        result = gql.query(query)
        projects_page = result["projects"]

        assert projects_page["objects"] == []
        assert projects_page["count"] == 0
        assert projects_page["totalCount"] == 0
        assert projects_page["hasMore"] is False


class TestImageQueries:
    """Test GraphQL queries for images."""

    async def test_create_and_query_image(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating an image and querying it back."""
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

        image_input = test_data.create_image_input("https://example.com/my-image.jpg")
        result = gql.mutate(create_mutation, image_input)

        created_image = result["createImage"]
        assert created_image["url"] == "https://example.com/my-image.jpg"
        assert created_image["id"]

        image_id = created_image["id"]

        # Query single image
        query = """
        query GetImage($id: ID!) {
            image(id: $id) {
                id
                url
            }
        }
        """

        result = gql.query(query, {"id": image_id})
        image = result["image"]

        assert image["id"] == image_id
        assert image["url"] == "https://example.com/my-image.jpg"

    async def test_query_images_pagination(self, monkeypatch: pytest.MonkeyPatch):
        """Test paginated images query."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create multiple images
        create_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
                url
            }
        }
        """

        for i in range(4):
            image_input = test_data.create_image_input(f"https://example.com/image-{i}.jpg")
            gql.mutate(create_mutation, image_input)

        # Query with pagination
        query = """
        query GetImages($limit: Int!, $offset: Int!) {
            images(limit: $limit, offset: $offset) {
                objects {
                    id
                    url
                }
                totalCount
                count
                limit
                offset
                hasMore
            }
        }
        """

        result = gql.query(query, {"limit": 2, "offset": 0})
        images_page = result["images"]

        assert len(images_page["objects"]) == 2
        assert images_page["count"] == 2
        assert images_page["totalCount"] == 4
        assert images_page["limit"] == 2
        assert images_page["offset"] == 0
        assert images_page["hasMore"] is True


class TestTaskQueries:
    """Test GraphQL queries for tasks."""

    async def test_create_and_query_task(self, monkeypatch: pytest.MonkeyPatch):
        """Test creating a task and querying it back."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create dependencies first
        create_project_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) {
                id
            }
        }
        """

        create_image_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) {
                id
            }
        }
        """

        project_result = gql.mutate(
            create_project_mutation, test_data.create_project_input("Task Project", "For task testing")
        )
        project_id = project_result["createProject"]["id"]

        image_result = gql.mutate(
            create_image_mutation, test_data.create_image_input("https://example.com/task-image.jpg")
        )
        image_id = image_result["createImage"]["id"]

        # Create a task
        create_task_mutation = """
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
            }
        }
        """

        task_input = test_data.create_task_input(image_id, project_id, status="DRAFT")
        result = gql.mutate(create_task_mutation, task_input)

        created_task = result["createTask"]
        assert created_task["status"] == "DRAFT"
        assert created_task["image"]["id"] == image_id
        assert created_task["project"]["id"] == project_id
        assert len(created_task["bboxes"]) == 1

        task_id = created_task["id"]

        # Query single task
        query = """
        query GetTask($id: ID!) {
            task(id: $id) {
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

        result = gql.query(query, {"id": task_id})
        task = result["task"]

        assert task["id"] == task_id
        assert task["status"] == "DRAFT"
        assert task["image"]["id"] == image_id
        assert task["project"]["id"] == project_id
        assert len(task["bboxes"]) == 1
        assert task["createdAt"]  # Should have timestamp

    async def test_query_tasks_pagination(self, monkeypatch: pytest.MonkeyPatch):
        """Test paginated tasks query."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create dependencies
        create_project_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        create_image_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) { id }
        }
        """

        project_result = gql.mutate(create_project_mutation, test_data.create_project_input())
        project_id = project_result["createProject"]["id"]

        image_result = gql.mutate(create_image_mutation, test_data.create_image_input())
        image_id = image_result["createImage"]["id"]

        # Create multiple tasks
        create_task_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $status: TaskStatus!) {
            createTask(imageId: $imageId, projectId: $projectId, status: $status) {
                id
            }
        }
        """

        statuses = ["DRAFT", "FINISHED", "REVIEWED"]
        for status in statuses:
            gql.mutate(create_task_mutation, {"imageId": image_id, "projectId": project_id, "status": status})

        # Query with pagination
        query = """
        query GetTasks($limit: Int!, $offset: Int!) {
            tasks(limit: $limit, offset: $offset) {
                objects {
                    id
                    status
                    image { id }
                    project { id }
                }
                totalCount
                count
                limit
                offset
                hasMore
            }
        }
        """

        result = gql.query(query, {"limit": 2, "offset": 0})
        tasks_page = result["tasks"]

        assert len(tasks_page["objects"]) == 2
        assert tasks_page["count"] == 2
        assert tasks_page["totalCount"] == 3
        assert tasks_page["limit"] == 2
        assert tasks_page["offset"] == 0
        assert tasks_page["hasMore"] is True

        # Verify all tasks have required nested objects
        for task in tasks_page["objects"]:
            assert task["image"]["id"] == image_id
            assert task["project"]["id"] == project_id
            assert task["status"] in ["DRAFT", "FINISHED", "REVIEWED"]

    async def test_query_task_field_selection(self, monkeypatch: pytest.MonkeyPatch):
        """Test GraphQL field selection - only request specific fields."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Setup data
        create_project_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        create_image_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) { id }
        }
        """

        create_task_mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!) {
            createTask(imageId: $imageId, projectId: $projectId) { id }
        }
        """

        project_result = gql.mutate(create_project_mutation, test_data.create_project_input())
        project_id = project_result["createProject"]["id"]

        image_result = gql.mutate(create_image_mutation, test_data.create_image_input())
        image_id = image_result["createImage"]["id"]

        task_result = gql.mutate(create_task_mutation, {"imageId": image_id, "projectId": project_id})
        task_id = task_result["createTask"]["id"]

        # Query with minimal field selection
        query = """
        query GetTask($id: ID!) {
            task(id: $id) {
                id
                status
                project {
                    name
                }
            }
        }
        """

        result = gql.query(query, {"id": task_id})
        task = result["task"]

        # Should only contain requested fields
        assert "id" in task
        assert "status" in task
        assert "project" in task
        assert "name" in task["project"]

        # Should not contain unrequested fields like image, bboxes, createdAt
        assert "image" not in task
        assert "bboxes" not in task
        assert "createdAt" not in task


class TestPaginationEdgeCases:
    """Test edge cases for pagination functionality."""

    async def test_pagination_offset_beyond_total(self, monkeypatch: pytest.MonkeyPatch):
        """Test pagination when offset is beyond total items."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create only 3 projects
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        for i in range(3):
            project_input = test_data.create_project_input(f"Project {i}", f"Description {i}")
            gql.mutate(create_mutation, project_input)

        # Query with offset beyond total
        query = """
        query GetProjects($limit: Int!, $offset: Int!) {
            projects(limit: $limit, offset: $offset) {
                objects { id name }
                totalCount
                count
                limit
                offset
                hasMore
            }
        }
        """

        result = gql.query(query, {"limit": 5, "offset": 10})
        projects_page = result["projects"]

        assert len(projects_page["objects"]) == 0
        assert projects_page["count"] == 0
        assert projects_page["totalCount"] == 3
        assert projects_page["limit"] == 5
        assert projects_page["offset"] == 10
        assert projects_page["hasMore"] is False

    async def test_pagination_limit_larger_than_total(self, monkeypatch: pytest.MonkeyPatch):
        """Test pagination when limit is larger than total items."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create only 3 images
        create_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) { id }
        }
        """

        for i in range(3):
            image_input = test_data.create_image_input(f"https://example.com/image-{i}.jpg")
            gql.mutate(create_mutation, image_input)

        # Query with limit larger than total
        query = """
        query GetImages($limit: Int!, $offset: Int!) {
            images(limit: $limit, offset: $offset) {
                objects { id url }
                totalCount
                count
                limit
                offset
                hasMore
            }
        }
        """

        result = gql.query(query, {"limit": 10, "offset": 0})
        images_page = result["images"]

        assert len(images_page["objects"]) == 3
        assert images_page["count"] == 3
        assert images_page["totalCount"] == 3
        assert images_page["limit"] == 10
        assert images_page["offset"] == 0
        assert images_page["hasMore"] is False

    async def test_pagination_exact_page_boundary(self, monkeypatch: pytest.MonkeyPatch):
        """Test pagination at exact page boundaries."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create exactly 6 projects (2 pages of 3)
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        for i in range(6):
            project_input = test_data.create_project_input(f"Project {i}", f"Description {i}")
            gql.mutate(create_mutation, project_input)

        query = """
        query GetProjects($limit: Int!, $offset: Int!) {
            projects(limit: $limit, offset: $offset) {
                objects { id name }
                totalCount
                count
                hasMore
            }
        }
        """

        # First page (0-2)
        result = gql.query(query, {"limit": 3, "offset": 0})
        page = result["projects"]
        assert len(page["objects"]) == 3
        assert page["totalCount"] == 6
        assert page["hasMore"] is True

        # Second page (3-5) - exact boundary
        result = gql.query(query, {"limit": 3, "offset": 3})
        page = result["projects"]
        assert len(page["objects"]) == 3
        assert page["totalCount"] == 6
        assert page["hasMore"] is False

        # Third page (6+) - beyond boundary
        result = gql.query(query, {"limit": 3, "offset": 6})
        page = result["projects"]
        assert len(page["objects"]) == 0
        assert page["totalCount"] == 6
        assert page["hasMore"] is False

    async def test_pagination_zero_limit(self, monkeypatch: pytest.MonkeyPatch):
        """Test pagination with zero limit."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create some projects
        create_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        for i in range(3):
            project_input = test_data.create_project_input(f"Project {i}", f"Description {i}")
            gql.mutate(create_mutation, project_input)

        query = """
        query GetProjects($limit: Int!, $offset: Int!) {
            projects(limit: $limit, offset: $offset) {
                objects { id name }
                totalCount
                count
                hasMore
            }
        }
        """

        # Query with zero limit
        result = gql.query(query, {"limit": 0, "offset": 0})
        page = result["projects"]

        assert len(page["objects"]) == 0
        assert page["count"] == 0
        assert page["totalCount"] == 3
        assert page["hasMore"] is True  # Still has more since we didn't fetch any

    async def test_pagination_single_item_pages(self, monkeypatch: pytest.MonkeyPatch):
        """Test pagination with single item per page."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # Create 3 images
        create_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) { id }
        }
        """

        for i in range(3):
            image_input = test_data.create_image_input(f"https://example.com/image-{i}.jpg")
            gql.mutate(create_mutation, image_input)

        query = """
        query GetImages($limit: Int!, $offset: Int!) {
            images(limit: $limit, offset: $offset) {
                objects { id url }
                totalCount
                count
                hasMore
            }
        }
        """

        # Page 1
        result = gql.query(query, {"limit": 1, "offset": 0})
        page = result["images"]
        assert len(page["objects"]) == 1
        assert page["totalCount"] == 3
        assert page["hasMore"] is True

        # Page 2
        result = gql.query(query, {"limit": 1, "offset": 1})
        page = result["images"]
        assert len(page["objects"]) == 1
        assert page["totalCount"] == 3
        assert page["hasMore"] is True

        # Page 3 (last)
        result = gql.query(query, {"limit": 1, "offset": 2})
        page = result["images"]
        assert len(page["objects"]) == 1
        assert page["totalCount"] == 3
        assert page["hasMore"] is False
