"""Tests for GraphQL introspection capabilities."""

from fastapi.testclient import TestClient

from tests.fixtures.sample_data import GRAPHQL_QUERIES


class TestGraphQLIntrospection:
    def test_introspection_query(self, test_client: TestClient):
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["introspection_schema"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        type_names = [t["name"] for t in data["data"]["__schema"]["types"]]
        assert "Image" in type_names
        assert "Query" in type_names
        assert "Mutation" in type_names

    def test_field_introspection(self, test_client: TestClient):
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["introspection_image_type"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        field_names = [f["name"] for f in data["data"]["__type"]["fields"]]
        assert "id" in field_names
        assert "url" in field_names
        assert "status" in field_names
        assert "createdAt" in field_names
        assert "updatedAt" in field_names
