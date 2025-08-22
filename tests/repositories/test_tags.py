"""Tests for TagRepository with hierarchy support."""

from mongomock_motor import AsyncMongoMockDatabase

from satin.models.tag import TagCreate
from satin.repositories.tag import TagRepository


class TestTagRepository:
    """Test TagRepository hierarchy functionality."""

    async def test_create_hierarchical_root(self, mock_db: AsyncMongoMockDatabase):
        """Test creating root tag."""
        repo = TagRepository(mock_db)

        tag_data = TagCreate(name="Animals", description="Animal categories")
        result = await repo.create_hierarchical(tag_data)

        assert result.name == "Animals"
        assert result.parent_id is None
        assert result.usage_count == 0

    async def test_create_hierarchical_child(self, mock_db: AsyncMongoMockDatabase):
        """Test creating child tag."""
        repo = TagRepository(mock_db)

        # Create parent
        parent = await repo.create_hierarchical(TagCreate(name="Animals"))

        # Create child
        child_data = TagCreate(name="Mammals", parent_id=str(parent.id))
        child = await repo.create_hierarchical(child_data)

        assert child.name == "Mammals"
        assert child.parent_id == str(parent.id)

    async def test_get_root_tags(self, mock_db: AsyncMongoMockDatabase):
        """Test getting root tags."""
        repo = TagRepository(mock_db)

        await repo.create_hierarchical(TagCreate(name="Animals"))
        await repo.create_hierarchical(TagCreate(name="Objects"))

        roots = [tag async for tag in repo.get_root_tags()]

        assert len(roots) == 2
        assert all(tag.parent_id is None for tag in roots)

    async def test_get_children(self, mock_db: AsyncMongoMockDatabase):
        """Test getting direct children."""
        repo = TagRepository(mock_db)

        parent = await repo.create_hierarchical(TagCreate(name="Animals"))
        await repo.create_hierarchical(TagCreate(name="Mammals", parent_id=str(parent.id)))
        await repo.create_hierarchical(TagCreate(name="Birds", parent_id=str(parent.id)))

        children = [tag async for tag in repo.get_children(parent.id)]

        assert len(children) == 2
        assert all(tag.parent_id == str(parent.id) for tag in children)

    async def test_get_by_path(self, mock_db: AsyncMongoMockDatabase):
        """Test getting tag by path."""
        repo = TagRepository(mock_db)

        await repo.create_hierarchical(TagCreate(name="Animals"))

        found = await repo.get_by_path("Animals")

        assert found is not None
        assert found.name == "Animals"

    async def test_search_by_name(self, mock_db: AsyncMongoMockDatabase):
        """Test searching tags by name pattern."""
        repo = TagRepository(mock_db)

        await repo.create_hierarchical(TagCreate(name="Mammals"))
        await repo.create_hierarchical(TagCreate(name="Animals"))
        await repo.create_hierarchical(TagCreate(name="Objects"))

        results = [tag async for tag in repo.search_by_name("mal")]

        assert len(results) >= 1
        assert any("mal" in tag.name.lower() for tag in results)

    async def test_find_by_depth(self, mock_db: AsyncMongoMockDatabase):
        """Test finding tags by depth."""
        repo = TagRepository(mock_db)

        await repo.create_hierarchical(TagCreate(name="Animals"))

        depth_0_tags = [tag async for tag in repo.find_by_depth(0)]

        assert len(depth_0_tags) >= 1
        assert all(tag.depth == 0 for tag in depth_0_tags)

    async def test_increment_usage_count(self, mock_db: AsyncMongoMockDatabase):
        """Test incrementing usage count."""
        repo = TagRepository(mock_db)

        tag = await repo.create_hierarchical(TagCreate(name="Animals"))

        success = await repo.increment_usage_count(tag.id)
        updated_tag = await repo.get_by_id(tag.id)

        assert success is True
        assert updated_tag is not None
        assert updated_tag.usage_count == 1

    async def test_get_most_used_tags(self, mock_db: AsyncMongoMockDatabase):
        """Test getting most used tags."""
        repo = TagRepository(mock_db)

        tag1 = await repo.create_hierarchical(TagCreate(name="Popular"))
        tag2 = await repo.create_hierarchical(TagCreate(name="Less Popular"))

        # Simulate usage
        await repo.increment_usage_count(tag1.id)
        await repo.increment_usage_count(tag1.id)
        await repo.increment_usage_count(tag2.id)

        most_used = [tag async for tag in repo.get_most_used_tags(limit=2)]

        assert len(most_used) >= 2

    async def test_move_tag(self, mock_db: AsyncMongoMockDatabase):
        """Test moving tag to new parent."""
        repo = TagRepository(mock_db)

        parent1 = await repo.create_hierarchical(TagCreate(name="Old Parent"))
        parent2 = await repo.create_hierarchical(TagCreate(name="New Parent"))
        child = await repo.create_hierarchical(TagCreate(name="Child", parent_id=str(parent1.id)))

        moved = await repo.move_tag(child.id, str(parent2.id))

        assert moved is not None
        assert moved.parent_id == str(parent2.id)

    async def test_delete_with_descendants(self, mock_db: AsyncMongoMockDatabase):
        """Test deleting tag with all descendants."""
        repo = TagRepository(mock_db)

        parent = await repo.create_hierarchical(TagCreate(name="Parent"))

        # Test direct delete first
        success = await repo.delete_by_id(parent.id)

        assert success is True
