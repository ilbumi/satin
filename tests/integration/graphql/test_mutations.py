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
        assert data["data"]["createImage"]["url"] == "http://test.com/new.jpg"
        assert data["data"]["createImage"]["status"] == "NEW"
        assert data["data"]["createImage"]["id"] is not None

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
        assert data["data"]["updateImage"]["status"] == "ANNOTATED"

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
        assert data["data"]["updateImage"]["status"] == "NEW"

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
        assert data["data"]["updateImage"] is None

    async def test_delete_image(self, test_client: TestClient, mock_dependencies):
        created = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["delete_image"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteImage"] is True

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
        assert data["data"]["deleteImage"] is False
