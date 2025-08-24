"""Tests for GraphQL tag mutations."""

from fastapi.testclient import TestClient

from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_tag


class TestTagMutations:
    def test_create_tag(self, test_client: TestClient):
        """Test creating a new tag."""
        tag_input = {
            "name": "animals",
            "description": "Animal-related tags",
            "color": "#FF5733",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": tag_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["createTag"]
        assert tag["name"] == "animals"
        assert tag["description"] == "Animal-related tags"
        assert tag["path"] == "animals"
        assert tag["depth"] == 0
        assert tag["parentId"] is None
        assert tag["id"] is not None

    def test_create_tag_minimal(self, test_client: TestClient):
        """Test creating tag with minimal required fields."""
        tag_input = {"name": "minimal_tag"}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": tag_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["createTag"]
        assert tag["name"] == "minimal_tag"
        assert tag["description"] == ""  # Default empty description
        assert tag["path"] == "minimal_tag"
        assert tag["depth"] == 0

    async def test_create_tag_with_parent(self, test_client: TestClient, mock_dependencies):
        """Test creating a tag with a parent."""
        # First create parent tag
        parent_data = create_test_tag(name="animals")
        parent = await mock_dependencies.tag_repo.create_hierarchical(parent_data)

        child_input = {
            "name": "mammals",
            "description": "Mammal animals",
            "parentId": str(parent.id),
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": child_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["createTag"]
        assert tag["name"] == "mammals"
        assert tag["parentId"] == str(parent.id)
        assert tag["path"] == "animals/mammals"
        assert tag["depth"] == 1

    def test_create_tag_with_nonexistent_parent(self, test_client: TestClient):
        """Test creating tag with non-existent parent."""
        tag_input = {
            "name": "orphan_tag",
            "parentId": "nonexistent-parent-id",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": tag_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["createTag"]
        # Should create as root tag when parent doesn't exist
        assert tag["name"] == "orphan_tag"
        assert tag["depth"] == 0
        assert tag["path"] == "orphan_tag"

    async def test_update_tag(self, test_client: TestClient, mock_dependencies):
        """Test updating an existing tag."""
        # Create initial tag
        tag_data = create_test_tag(name="animals", description="Original description")
        created = await mock_dependencies.tag_repo.create_hierarchical(tag_data)

        update_input = {
            "name": "updated_animals",
            "description": "Updated description",
            "color": "#00FF00",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": str(created.id), "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["updateTag"]
        assert tag["name"] == "updated_animals"
        assert tag["description"] == "Updated description"

    async def test_update_tag_partial(self, test_client: TestClient, mock_dependencies):
        """Test updating tag with partial fields."""
        tag_data = create_test_tag(name="animals", description="Original")
        created = await mock_dependencies.tag_repo.create_hierarchical(tag_data)

        update_input = {"description": "Only description updated"}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": str(created.id), "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["updateTag"]
        assert tag["name"] == "animals"  # Should remain unchanged
        assert tag["description"] == "Only description updated"

    async def test_update_tag_change_parent(self, test_client: TestClient, mock_dependencies):
        """Test updating tag to change its parent."""
        # Create tags
        old_parent = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="animals"))
        new_parent = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="vehicles"))

        child_data = create_test_tag(name="fast_things", parent_id=str(old_parent.id))
        child = await mock_dependencies.tag_repo.create_hierarchical(child_data)

        update_input = {"parentId": str(new_parent.id)}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": str(child.id), "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["updateTag"]
        assert tag["parentId"] == str(new_parent.id)

    async def test_update_tag_no_changes(self, test_client: TestClient, mock_dependencies):
        """Test updating tag with no changes."""
        tag_data = create_test_tag(name="animals", description="Test")
        created = await mock_dependencies.tag_repo.create_hierarchical(tag_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": str(created.id), "input": {}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        tag = data["data"]["updateTag"]
        assert tag["name"] == "animals"
        assert tag["description"] == "Test"

    def test_update_nonexistent_tag(self, test_client: TestClient):
        """Test updating non-existent tag."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": "nonexistent", "input": {"name": "updated"}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateTag"] is None

    async def test_delete_tag(self, test_client: TestClient, mock_dependencies):
        """Test deleting a tag."""
        tag_data = create_test_tag(name="to_be_deleted")
        created = await mock_dependencies.tag_repo.create_hierarchical(tag_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["delete_tag"],
                "variables": {"id": str(created.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        deleted_count = data["data"]["deleteTag"]
        assert deleted_count >= 1  # Should delete at least the tag itself

        # Verify tag is deleted
        deleted_tag = await mock_dependencies.tag_repo.get_by_id(created.id)
        assert deleted_tag is None

    async def test_delete_tag_with_descendants(self, test_client: TestClient, mock_dependencies):
        """Test deleting tag with children (should delete all descendants)."""
        # Create parent and child tags
        parent_data = create_test_tag(name="parent")
        parent = await mock_dependencies.tag_repo.create_hierarchical(parent_data)

        child_data = create_test_tag(name="child", parent_id=str(parent.id))
        child = await mock_dependencies.tag_repo.create_hierarchical(child_data)

        grandchild_data = create_test_tag(name="grandchild", parent_id=str(child.id))
        await mock_dependencies.tag_repo.create_hierarchical(grandchild_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["delete_tag"],
                "variables": {"id": str(parent.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        deleted_count = data["data"]["deleteTag"]
        assert deleted_count == 3  # Should delete parent + child + grandchild

        # Verify all are deleted
        assert await mock_dependencies.tag_repo.get_by_id(parent.id) is None
        assert await mock_dependencies.tag_repo.get_by_id(child.id) is None

    def test_delete_nonexistent_tag(self, test_client: TestClient):
        """Test deleting non-existent tag."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["delete_tag"],
                "variables": {"id": "nonexistent"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        deleted_count = data["data"]["deleteTag"]
        assert deleted_count == 0

    async def test_move_tag(self, test_client: TestClient, mock_dependencies):
        """Test moving a tag to a new parent."""
        # Create structure
        old_parent = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="animals"))
        new_parent = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="vehicles"))

        child_data = create_test_tag(name="fast_things", parent_id=str(old_parent.id))
        child = await mock_dependencies.tag_repo.create_hierarchical(child_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["move_tag"],
                "variables": {
                    "tagId": str(child.id),
                    "newParentId": str(new_parent.id),
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        moved_tag = data["data"]["moveTag"]
        assert moved_tag is not None
        assert moved_tag["parentId"] == str(new_parent.id)

    async def test_move_tag_to_root(self, test_client: TestClient, mock_dependencies):
        """Test moving a tag to root level (no parent)."""
        parent = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="parent"))
        child_data = create_test_tag(name="child", parent_id=str(parent.id))
        child = await mock_dependencies.tag_repo.create_hierarchical(child_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["move_tag"],
                "variables": {
                    "tagId": str(child.id),
                    "newParentId": None,
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        moved_tag = data["data"]["moveTag"]
        assert moved_tag is not None
        assert moved_tag["parentId"] is None
        assert moved_tag["depth"] == 0

    async def test_move_tag_prevent_circular_reference(self, test_client: TestClient, mock_dependencies):
        """Test that moving a tag to its own descendant is prevented."""
        parent_data = create_test_tag(name="parent")
        parent = await mock_dependencies.tag_repo.create_hierarchical(parent_data)

        child_data = create_test_tag(name="child", parent_id=str(parent.id))
        child = await mock_dependencies.tag_repo.create_hierarchical(child_data)

        # Try to move parent to be child of its own child (should fail)
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["move_tag"],
                "variables": {
                    "tagId": str(parent.id),
                    "newParentId": str(child.id),
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        moved_tag = data["data"]["moveTag"]
        assert moved_tag is None  # Should return None for invalid move

    def test_move_nonexistent_tag(self, test_client: TestClient):
        """Test moving non-existent tag."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["move_tag"],
                "variables": {
                    "tagId": "nonexistent",
                    "newParentId": "also-nonexistent",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["moveTag"] is None


class TestTagMutationErrorHandling:
    def test_create_tag_missing_name(self, test_client: TestClient):
        """Test creating tag with missing required name field."""
        tag_input = {"description": "Missing name"}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": tag_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_create_tag_invalid_input_type(self, test_client: TestClient):
        """Test creating tag with invalid input type."""
        tag_input = {"name": 123}  # Should be string

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": tag_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_update_tag_invalid_input_type(self, test_client: TestClient):
        """Test updating tag with invalid input type."""
        update_input = {"name": ["not", "a", "string"]}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_tag"],
                "variables": {"id": "test-id", "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variables(self, test_client: TestClient):
        """Test mutations missing required variables."""
        # Test create tag without input
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["create_tag"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test update tag without id
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["update_tag"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test delete tag without id
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["delete_tag"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test move tag without tagId
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["move_tag"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data
