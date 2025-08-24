"""Tests for TagRepository with hierarchy support."""

import pytest
from bson import ObjectId
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.tag import TagUpdate
from satin.repositories.tag import TagRepository
from tests.fixtures.sample_data import create_test_tag


class TestTagRepositoryHierarchy:
    async def test_create_hierarchical_root(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)
        tag_data = create_test_tag("Animals", description="Animal categories")

        result = await repo.create_hierarchical(tag_data)

        assert result.name == "Animals"
        assert result.parent_id is None
        assert result.usage_count == 0

    async def test_create_hierarchical_child(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        # Create parent
        parent = await repo.create_hierarchical(create_test_tag("Animals"))

        # Create child
        child_data = create_test_tag("Dogs", parent_id=str(parent.id))
        child = await repo.create_hierarchical(child_data)

        assert child.name == "Dogs"
        assert str(child.parent_id) == str(parent.id)

    async def test_get_descendants(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        # Create hierarchy: Animals -> Dogs -> Breeds
        parent = await repo.create_hierarchical(create_test_tag("Animals"))
        dogs = await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(parent.id)))
        await repo.create_hierarchical(create_test_tag("Breeds", parent_id=str(dogs.id)))

        descendants = [tag async for tag in repo.get_descendants(parent.id)]

        assert len(descendants) == 2  # Dogs and Breeds
        names = [tag.name for tag in descendants]
        assert "Dogs" in names
        assert "Breeds" in names

    async def test_get_ancestors(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        # Create hierarchy
        root = await repo.create_hierarchical(create_test_tag("Animals"))
        dogs = await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(root.id)))
        breed = await repo.create_hierarchical(create_test_tag("Golden", parent_id=str(dogs.id)))

        ancestors = [tag async for tag in repo.get_ancestors(breed.id)]

        assert len(ancestors) >= 1  # At least Dogs
        names = [tag.name for tag in ancestors]
        assert "Dogs" in names


class TestTagRepositoryQueries:
    async def test_get_root_tags(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        # Create root and child tags
        root1 = await repo.create_hierarchical(create_test_tag("Animals"))
        await repo.create_hierarchical(create_test_tag("Vehicles"))
        await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(root1.id)))

        root_tags = [tag async for tag in repo.get_root_tags()]

        assert len(root_tags) == 2
        names = [tag.name for tag in root_tags]
        assert "Animals" in names
        assert "Vehicles" in names

    @pytest.mark.parametrize(
        ("search_term", "expected_count"),
        [
            ("Dog", 1),
            ("An", 1),  # Should match "Animals"
            ("xyz", 0),
        ],
    )
    async def test_search_by_name(self, mock_db: AsyncMongoMockDatabase, search_term, expected_count):
        repo = TagRepository(mock_db)

        await repo.create_hierarchical(create_test_tag("Animals"))
        await repo.create_hierarchical(create_test_tag("Dogs"))

        results = [tag async for tag in repo.search_by_name(search_term)]

        assert len(results) == expected_count

    async def test_increment_usage_count(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        tag = await repo.create_hierarchical(create_test_tag("TestTag"))

        await repo.increment_usage_count(tag.id)
        updated = await repo.get_by_id(tag.id)

        assert updated.usage_count == 1

    async def test_get_most_used_tags(self, mock_db: AsyncMongoMockDatabase):
        repo = TagRepository(mock_db)

        # Create tags with different usage counts
        popular = await repo.create_hierarchical(create_test_tag("Popular"))
        unpopular = await repo.create_hierarchical(create_test_tag("Unpopular"))

        # Increment usage for popular tag
        for _ in range(5):
            await repo.increment_usage_count(popular.id)

        await repo.increment_usage_count(unpopular.id)

        top_tags = [tag async for tag in repo.get_most_used_tags(limit=1)]

        assert len(top_tags) == 1
        assert top_tags[0].name == "Popular"


class TestTagRepositoryMissingMethods:
    """Test previously untested tag repository methods."""

    async def test_get_by_path(self, mock_db: AsyncMongoMockDatabase):
        """Test getting tag by hierarchical path."""
        repo = TagRepository(mock_db)

        # Create hierarchy: Animals -> Dogs -> Golden
        animals = await repo.create_hierarchical(create_test_tag("Animals"))
        dogs = await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(animals.id)))
        await repo.create_hierarchical(create_test_tag("Golden", parent_id=str(dogs.id)))

        # Test path lookup
        found_animals = await repo.get_by_path("Animals")
        found_dogs = await repo.get_by_path("Animals/Dogs")
        found_golden = await repo.get_by_path("Animals/Dogs/Golden")

        assert found_animals is not None
        assert found_animals.name == "Animals"
        assert found_dogs is not None
        assert found_dogs.name == "Dogs"
        assert found_golden is not None
        assert found_golden.name == "Golden"

        # Test non-existent path
        not_found = await repo.get_by_path("NonExistent/Path")
        assert not_found is None

    async def test_find_by_depth(self, mock_db: AsyncMongoMockDatabase):
        """Test finding tags at specific depth levels."""
        repo = TagRepository(mock_db)

        # Create hierarchy with different depths
        root1 = await repo.create_hierarchical(create_test_tag("Root1"))  # depth 0
        await repo.create_hierarchical(create_test_tag("Root2"))  # depth 0
        child1 = await repo.create_hierarchical(create_test_tag("Child1", parent_id=str(root1.id)))  # depth 1
        await repo.create_hierarchical(create_test_tag("Child2", parent_id=str(root1.id)))  # depth 1
        await repo.create_hierarchical(create_test_tag("Grandchild", parent_id=str(child1.id)))  # depth 2

        # Test depth filtering
        depth_0 = [tag async for tag in repo.find_by_depth(0)]
        depth_1 = [tag async for tag in repo.find_by_depth(1)]
        depth_2 = [tag async for tag in repo.find_by_depth(2)]
        depth_99 = [tag async for tag in repo.find_by_depth(99)]

        assert len(depth_0) == 2
        assert len(depth_1) == 2
        assert len(depth_2) == 1
        assert len(depth_99) == 0

        # Check names at each depth
        names_0 = [tag.name for tag in depth_0]
        assert "Root1" in names_0
        assert "Root2" in names_0

        names_1 = [tag.name for tag in depth_1]
        assert "Child1" in names_1
        assert "Child2" in names_1

        names_2 = [tag.name for tag in depth_2]
        assert "Grandchild" in names_2

    async def test_get_tag_statistics(self, mock_db: AsyncMongoMockDatabase):
        """Test getting tag usage statistics."""
        repo = TagRepository(mock_db)

        # Create tags with different usage counts
        tag1 = await repo.create_hierarchical(create_test_tag("Tag1"))
        tag2 = await repo.create_hierarchical(create_test_tag("Tag2"))
        await repo.create_hierarchical(create_test_tag("Child", parent_id=str(tag1.id)))

        # Increment usage counts
        await repo.increment_usage_count(tag1.id)
        await repo.increment_usage_count(tag1.id)
        await repo.increment_usage_count(tag2.id)

        stats = await repo.get_tag_statistics()

        # Should have 3 total tags, max depth 1, total usage 3
        assert stats["total_tags"] == 3
        assert stats["total_usage"] == 3
        assert stats["max_depth"] == 1
        assert stats["avg_usage"] == 1.0

    async def test_would_create_cycle(self, mock_db: AsyncMongoMockDatabase):
        """Test cycle detection in hierarchy."""
        repo = TagRepository(mock_db)

        # Create hierarchy: A -> B -> C
        tag_a = await repo.create_hierarchical(create_test_tag("A"))
        tag_b = await repo.create_hierarchical(create_test_tag("B", parent_id=str(tag_a.id)))
        tag_c = await repo.create_hierarchical(create_test_tag("C", parent_id=str(tag_b.id)))

        # Test cycle detection (trying to make A a child of C would create a cycle)
        would_cycle = await repo.would_create_cycle(tag_a.id, tag_c.id)
        assert would_cycle is True  # A is ancestor of C, making A child of C creates cycle

        # Test non-cycle case (making C child of a new parent wouldn't create cycle)
        would_cycle_reverse = await repo.would_create_cycle(tag_c.id, tag_a.id)
        assert would_cycle_reverse is False  # C is descendant of A, no cycle created

        # Test with self-reference
        would_self_cycle = await repo.would_create_cycle(tag_a.id, tag_a.id)
        assert would_self_cycle is False  # A is not a descendant of itself

    async def test_move_tag_with_cycle_prevention(self, mock_db: AsyncMongoMockDatabase):
        """Test moving tags with cycle prevention."""
        repo = TagRepository(mock_db)

        # Create hierarchy: A -> B -> C
        tag_a = await repo.create_hierarchical(create_test_tag("A"))
        tag_b = await repo.create_hierarchical(create_test_tag("B", parent_id=str(tag_a.id)))
        tag_c = await repo.create_hierarchical(create_test_tag("C", parent_id=str(tag_b.id)))

        # Try to create cycle by making A child of C (should fail)
        result = await repo.move_tag(tag_a.id, str(tag_c.id))
        assert result is None  # Should prevent cycle

        # Verify A is still root
        updated_a = await repo.get_by_id(tag_a.id)
        assert updated_a.parent_id is None

        # Test valid move (move C to be child of A directly)
        result = await repo.move_tag(tag_c.id, str(tag_a.id))
        assert result is not None
        assert result.parent_id == str(tag_a.id)
        assert result.path == "A/C"
        assert result.depth == 1

    async def test_delete_with_descendants(self, mock_db: AsyncMongoMockDatabase):
        """Test deleting tag with all descendants."""
        repo = TagRepository(mock_db)

        # Create hierarchy: Animals -> Dogs -> [Breeds, Size]
        animals = await repo.create_hierarchical(create_test_tag("Animals"))
        dogs = await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(animals.id)))
        breeds = await repo.create_hierarchical(create_test_tag("Breeds", parent_id=str(dogs.id)))
        size = await repo.create_hierarchical(create_test_tag("Size", parent_id=str(dogs.id)))

        # Create separate tree: Vehicles -> Cars
        vehicles = await repo.create_hierarchical(create_test_tag("Vehicles"))
        cars = await repo.create_hierarchical(create_test_tag("Cars", parent_id=str(vehicles.id)))

        # Delete Dogs and all descendants
        deleted_count = await repo.delete_with_descendants(dogs.id)

        # Should delete Dogs, Breeds, and Size (3 tags)
        assert deleted_count == 3

        # Verify Animals and Vehicles tree still exist
        remaining_animals = await repo.get_by_id(animals.id)
        remaining_vehicles = await repo.get_by_id(vehicles.id)
        remaining_cars = await repo.get_by_id(cars.id)

        assert remaining_animals is not None
        assert remaining_vehicles is not None
        assert remaining_cars is not None

        # Verify deleted tags don't exist
        assert await repo.get_by_id(dogs.id) is None
        assert await repo.get_by_id(breeds.id) is None
        assert await repo.get_by_id(size.id) is None

    async def test_update_hierarchical_with_parent_change(self, mock_db: AsyncMongoMockDatabase):
        """Test updating tag with parent change recalculates hierarchy."""
        repo = TagRepository(mock_db)

        # Create initial hierarchy: A -> B -> C
        tag_a = await repo.create_hierarchical(create_test_tag("A"))
        tag_b = await repo.create_hierarchical(create_test_tag("B", parent_id=str(tag_a.id)))
        tag_c = await repo.create_hierarchical(create_test_tag("C", parent_id=str(tag_b.id)))

        # Create separate root: D
        tag_d = await repo.create_hierarchical(create_test_tag("D"))

        update_data = TagUpdate(parent_id=str(tag_d.id))
        result = await repo.update_hierarchical(tag_b.id, update_data)

        assert result is not None
        assert result.parent_id == str(tag_d.id)
        assert result.path == "D/B"
        assert result.depth == 1

        # Check that C was also updated (should now be D/B/C)
        updated_c = await repo.get_by_id(tag_c.id)
        assert updated_c.path == "D/B/C"
        assert updated_c.depth == 2

    async def test_update_hierarchical_with_name_change(self, mock_db: AsyncMongoMockDatabase):
        """Test updating tag name updates all descendant paths."""
        repo = TagRepository(mock_db)

        # Create hierarchy: Animals -> Dogs -> Golden
        animals = await repo.create_hierarchical(create_test_tag("Animals"))
        dogs = await repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(animals.id)))
        golden = await repo.create_hierarchical(create_test_tag("Golden", parent_id=str(dogs.id)))

        update_data = TagUpdate(name="Canines")
        result = await repo.update_hierarchical(dogs.id, update_data)

        assert result is not None
        assert result.name == "Canines"
        assert result.path == "Animals/Canines"

        # Check that Golden's path was also updated
        updated_golden = await repo.get_by_id(golden.id)
        assert updated_golden.path == "Animals/Canines/Golden"


class TestTagRepositoryErrorHandling:
    """Test error handling and edge cases."""

    async def test_operations_with_invalid_ids(self, mock_db: AsyncMongoMockDatabase):
        """Test operations with invalid ObjectIds."""
        repo = TagRepository(mock_db)

        invalid_id = "invalid-object-id"

        # Should handle gracefully
        assert await repo.get_by_id(invalid_id) is None

        # Should return empty iterators
        children = [tag async for tag in repo.get_children(invalid_id)]
        assert len(children) == 0

        descendants = [tag async for tag in repo.get_descendants(invalid_id)]
        assert len(descendants) == 0

        ancestors = [tag async for tag in repo.get_ancestors(invalid_id)]
        assert len(ancestors) == 0

    async def test_create_hierarchical_with_invalid_parent(self, mock_db: AsyncMongoMockDatabase):
        """Test creating tag with non-existent parent."""
        repo = TagRepository(mock_db)

        fake_parent_id = str(ObjectId())
        tag_data = create_test_tag("Orphan", parent_id=fake_parent_id)

        # Should create at root level when parent doesn't exist
        result = await repo.create_hierarchical(tag_data)

        assert result.parent_id == fake_parent_id  # Preserves original parent_id
        assert result.depth == 0  # But treats as root
        assert result.path == "Orphan"  # Uses just the name

    async def test_get_tree_from_nonexistent_root(self, mock_db: AsyncMongoMockDatabase):
        """Test getting tree from non-existent root."""
        repo = TagRepository(mock_db)

        fake_root_id = str(ObjectId())
        tree = [tag async for tag in repo.get_tree_from_root(fake_root_id)]

        # Should return empty tree
        assert len(tree) == 0

    async def test_increment_usage_count_invalid_id(self, mock_db: AsyncMongoMockDatabase):
        """Test incrementing usage count for invalid ID."""
        repo = TagRepository(mock_db)

        fake_id = str(ObjectId())
        result = await repo.increment_usage_count(fake_id)

        # Should return False (no documents modified)
        assert result is False
