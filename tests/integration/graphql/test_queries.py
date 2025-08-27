"""Tests for GraphQL queries."""

from fastapi.testclient import TestClient

from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_image


class TestGraphQLQueries:
    def test_query_images_empty(self, test_client: TestClient):
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_images"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["images"] == []

    async def test_query_images_with_data(self, test_client: TestClient, mock_dependencies):
        # Create test images
        await mock_dependencies.image_repo.create(create_test_image("http://test1.com/image.jpg"))
        await mock_dependencies.image_repo.create(create_test_image("http://test2.com/image.png"))

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_images"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]["images"]) == 2
        assert data["data"]["images"][0]["url"] == "http://test1.com/image.jpg"
        assert data["data"]["images"][0]["status"] == "NEW"
        assert data["data"]["images"][1]["url"] == "http://test2.com/image.png"

    async def test_query_image_by_id(self, test_client: TestClient, mock_dependencies):
        created = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_image"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["image"]["url"] == "http://test.com/image.jpg"
        assert data["data"]["image"]["status"] == "NEW"

    def test_query_image_not_found(self, test_client: TestClient):
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_image"], "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["image"] is None


class TestGraphQLErrorHandling:
    def test_invalid_query_syntax(self, test_client: TestClient):
        invalid_query = """
            query {
                images {
                    invalid_field
                }
            }
        """

        response = test_client.post("/graphql", json={"query": invalid_query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variable(self, test_client: TestClient):
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["get_image"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_invalid_mutation_input(self, test_client: TestClient):
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["create_image"], "variables": {"input": {}}},  # Missing url
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data
