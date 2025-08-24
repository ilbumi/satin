"""Tests for GraphQL tag queries."""

from fastapi.testclient import TestClient

from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_tag


class TestTagQueries:
    def test_query_tags_empty(self, test_client: TestClient):
        """Test querying tags when none exist."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_tags"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["tags"] == []

    async def test_query_tags_with_data(self, test_client: TestClient, mock_dependencies):
        """Test querying tags with sample data."""
        # Create test tags
        tag1 = create_test_tag(name="animals", description="Animal tags")
        tag2 = create_test_tag(name="vehicles", description="Vehicle tags")

        await mock_dependencies.tag_repo.create_hierarchical(tag1)
        await mock_dependencies.tag_repo.create_hierarchical(tag2)

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_tags"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]["tags"]) == 2

        # Check that tags have correct properties
        tag_data = data["data"]["tags"][0]
        assert "id" in tag_data
        assert "name" in tag_data
        assert "path" in tag_data
        assert "depth" in tag_data
        assert tag_data["depth"] == 0  # Root tags have depth 0

    async def test_query_tag_by_id(self, test_client: TestClient, mock_dependencies):
        """Test querying a single tag by ID."""
        tag_data = create_test_tag(name="test_tag", description="Test tag description")
        created = await mock_dependencies.tag_repo.create_hierarchical(tag_data)

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_tag"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["tag"]["name"] == "test_tag"
        assert data["data"]["tag"]["description"] == "Test tag description"
        assert data["data"]["tag"]["path"] == "test_tag"
        assert data["data"]["tag"]["depth"] == 0

    def test_query_tag_not_found(self, test_client: TestClient):
        """Test querying a non-existent tag."""
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_tag"], "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["tag"] is None

    async def test_query_root_tags(self, test_client: TestClient, mock_dependencies):
        """Test querying root tags only."""
        # Create root tags
        root1 = create_test_tag(name="animals")
        root2 = create_test_tag(name="vehicles")
        created_root1 = await mock_dependencies.tag_repo.create_hierarchical(root1)
        await mock_dependencies.tag_repo.create_hierarchical(root2)

        # Create child tag
        child = create_test_tag(name="dogs", parent_id=str(created_root1.id))
        await mock_dependencies.tag_repo.create_hierarchical(child)

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["root_tags"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        root_tags = data["data"]["rootTags"]
        assert len(root_tags) == 2

        # All returned tags should have depth 0 (root level)
        for tag in root_tags:
            assert tag["depth"] == 0

        # Check that names are correct
        names = [tag["name"] for tag in root_tags]
        assert "animals" in names
        assert "vehicles" in names
        assert "dogs" not in names  # Child should not be in root tags

    async def test_query_tag_children(self, test_client: TestClient, mock_dependencies):
        """Test querying children of a specific tag."""
        # Create parent tag
        parent = create_test_tag(name="animals")
        created_parent = await mock_dependencies.tag_repo.create_hierarchical(parent)

        # Create child tags
        child1 = create_test_tag(name="dogs", parent_id=str(created_parent.id))
        child2 = create_test_tag(name="cats", parent_id=str(created_parent.id))
        await mock_dependencies.tag_repo.create_hierarchical(child1)
        await mock_dependencies.tag_repo.create_hierarchical(child2)

        # Create unrelated tag
        unrelated = create_test_tag(name="vehicles")
        await mock_dependencies.tag_repo.create_hierarchical(unrelated)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["tag_children"],
                "variables": {"parentId": str(created_parent.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        children = data["data"]["tagChildren"]
        assert len(children) == 2

        # All children should have depth 1
        for child in children:
            assert child["depth"] == 1

        # Check names
        names = [child["name"] for child in children]
        assert "dogs" in names
        assert "cats" in names
        assert "vehicles" not in names

    async def test_query_tag_tree(self, test_client: TestClient, mock_dependencies):
        """Test querying complete tag tree."""
        # Create hierarchical structure
        root = create_test_tag(name="animals")
        created_root = await mock_dependencies.tag_repo.create_hierarchical(root)

        child = create_test_tag(name="mammals", parent_id=str(created_root.id))
        created_child = await mock_dependencies.tag_repo.create_hierarchical(child)

        grandchild = create_test_tag(name="dogs", parent_id=str(created_child.id))
        await mock_dependencies.tag_repo.create_hierarchical(grandchild)

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["tag_tree"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tree = data["data"]["tagTree"]
        assert len(tree) >= 3

        # Check that we have different depth levels
        depths = [tag["depth"] for tag in tree]
        assert 0 in depths  # Root
        assert 1 in depths  # Child
        assert 2 in depths  # Grandchild

    async def test_query_tag_tree_from_root(self, test_client: TestClient, mock_dependencies):
        """Test querying tag tree from specific root."""
        # Create two separate trees
        root1 = create_test_tag(name="animals")
        root2 = create_test_tag(name="vehicles")
        created_root1 = await mock_dependencies.tag_repo.create_hierarchical(root1)
        created_root2 = await mock_dependencies.tag_repo.create_hierarchical(root2)

        # Add children to both
        child1 = create_test_tag(name="dogs", parent_id=str(created_root1.id))
        child2 = create_test_tag(name="cars", parent_id=str(created_root2.id))
        await mock_dependencies.tag_repo.create_hierarchical(child1)
        await mock_dependencies.tag_repo.create_hierarchical(child2)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["tag_tree"],
                "variables": {"rootId": str(created_root1.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tree = data["data"]["tagTree"]

        # Should only contain animals tree
        paths = [tag["path"] for tag in tree]
        assert any("animals" in path for path in paths)
        assert not any("vehicles" in path for path in paths)

    async def test_search_tags(self, test_client: TestClient, mock_dependencies):
        """Test searching tags by name pattern."""
        # Create tags with different names
        tags = [
            create_test_tag(name="dog"),
            create_test_tag(name="doggy"),
            create_test_tag(name="cat"),
            create_test_tag(name="big_dog"),
        ]

        for tag in tags:
            await mock_dependencies.tag_repo.create_hierarchical(tag)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["search_tags"],
                "variables": {"namePattern": "dog"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        results = data["data"]["searchTags"]

        # Should find tags containing "dog"
        names = [tag["name"] for tag in results]
        assert "dog" in names
        assert "doggy" in names
        assert "big_dog" in names
        assert "cat" not in names

    async def test_search_tags_case_insensitive(self, test_client: TestClient, mock_dependencies):
        """Test that tag search is case insensitive."""
        tag = create_test_tag(name="DOG")
        await mock_dependencies.tag_repo.create_hierarchical(tag)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["search_tags"],
                "variables": {"namePattern": "dog"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        results = data["data"]["searchTags"]
        assert len(results) >= 1
        assert any(tag["name"] == "DOG" for tag in results)


class TestTagQueryErrorHandling:
    def test_invalid_tag_field(self, test_client: TestClient):
        """Test querying with invalid field."""
        invalid_query = """
            query {
                tags {
                    invalidField
                }
            }
        """

        response = test_client.post("/graphql", json={"query": invalid_query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variable_tag_children(self, test_client: TestClient):
        """Test tag children query missing required variable."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["tag_children"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variable_search(self, test_client: TestClient):
        """Test search tags query missing required variable."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["search_tags"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    async def test_tag_children_nonexistent_parent(self, test_client: TestClient, mock_dependencies):  # noqa: ARG002
        """Test querying children of non-existent parent."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["tag_children"],
                "variables": {"parentId": "nonexistent"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["tagChildren"] == []

    def test_search_tags_empty_pattern(self, test_client: TestClient):
        """Test searching with empty pattern."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["search_tags"],
                "variables": {"namePattern": ""},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        # Empty pattern should still return results (matches all)
        assert isinstance(data["data"]["searchTags"], list)
