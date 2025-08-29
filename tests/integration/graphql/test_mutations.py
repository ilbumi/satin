"""Tests for GraphQL mutations."""

from fastapi.testclient import TestClient

from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_image


class TestGraphQLMutations:
    def test_create_image(self, test_client: TestClient):
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_image"],
                "variables": {"input": {"url": "http://test.com/new.jpg"}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        result = data["data"]["createImage"]
        assert "data" in result
        image = result["data"]
        assert image["url"] == "http://test.com/new.jpg"
        assert image["status"] == "NEW"
        assert image["id"] is not None

    async def test_update_image_status(self, test_client: TestClient, mock_dependencies):
        created = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_image"],
                "variables": {
                    "id": str(created.id),
                    "input": {"status": "ANNOTATED"},
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        result = data["data"]["updateImage"]
        assert "data" in result
        assert result["data"]["status"] == "ANNOTATED"

    async def test_update_image_no_changes(self, test_client: TestClient, mock_dependencies):
        created = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_image"],
                "variables": {"id": str(created.id), "input": {}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        result = data["data"]["updateImage"]
        assert "data" in result
        assert result["data"]["status"] == "NEW"

    def test_update_nonexistent_image(self, test_client: TestClient):
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_image"],
                "variables": {
                    "id": "nonexistent",
                    "input": {"status": "ANNOTATED"},
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        result = data["data"]["updateImage"]
        # When not found, should return NotFoundError
        assert "resource" in result or "message" in result

    async def test_delete_image(self, test_client: TestClient, mock_dependencies):
        created = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["delete_image"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteImage"]["deleted"] is True

        # Verify it's deleted
        deleted = await mock_dependencies.image_repo.get_by_id(created.id)
        assert deleted is None

    def test_delete_nonexistent_image(self, test_client: TestClient):
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["delete_image"], "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteImage"]["deleted"] is False
