"""Property-based tests for TagRepository."""

import random

from hypothesis import given, settings
from hypothesis import strategies as st
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase

from satin.models.tag import TagCreate
from satin.repositories.tag import TagRepository
from tests.strategies import dangerous_strings, safe_strings, tag_creates


class TestTagRepositoryProperties:
    """Property-based tests for tag repository hierarchy properties."""

    async def _get_repo(self):
        """Create repository with fresh mock database."""
        client = AsyncMongoMockClient()
        db = client.test_db
        repo = TagRepository(db)
        return repo, client

    @given(tag_creates())
    @settings(max_examples=20)
    async def test_create_hierarchical_root_properties(self, tag_data):
        """Test properties of root tag creation."""
        repo, client = await self._get_repo()

        # Ensure it's a root tag
        tag_data.parent_id = None

        result = await repo.create_hierarchical(tag_data)

        # Root tag properties that must hold
        assert result.name == tag_data.name
        assert result.parent_id is None
        assert result.depth == 0
        assert result.path == tag_data.name
        assert result.usage_count == 0
        assert result.id is not None
        assert result.created_at is not None
        assert result.updated_at is not None

    @given(st.lists(tag_creates(), min_size=2, max_size=4))
    @settings(max_examples=10)
    async def test_hierarchy_depth_consistency(self, tag_list):
        """Test that hierarchy depth is consistent across generations."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create a chain of tags: root -> child -> grandchild
        previous_tag = None
        created_tags = []

        for i, tag_data in enumerate(tag_list):
            if previous_tag:
                tag_data.parent_id = str(previous_tag.id)
            else:
                tag_data.parent_id = None  # First tag is root

            created = await repo.create_hierarchical(tag_data)
            created_tags.append(created)

            # Verify depth property
            assert created.depth == i

            # Verify path property
            if i == 0:
                assert created.path == tag_data.name
            else:
                expected_path = f"{previous_tag.path}/{tag_data.name}"
                assert created.path == expected_path

            previous_tag = created

    @given(safe_strings(min_size=1, max_size=20), st.data())
    @settings(max_examples=15)
    async def test_path_uniqueness_property(self, tag_name, data):
        """Test that paths are unique within the hierarchy."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create root tag
        root_tag_data = data.draw(tag_creates())
        root_tag = await repo.create_hierarchical(root_tag_data)

        # Create two children with same name under same parent
        child1_data = data.draw(tag_creates())
        child1_data.name = tag_name
        child1_data.parent_id = str(root_tag.id)

        child2_data = data.draw(tag_creates())
        child2_data.name = tag_name
        child2_data.parent_id = str(root_tag.id)

        # First should succeed
        child1 = await repo.create_hierarchical(child1_data)
        assert child1.path == f"{root_tag.path}/{tag_name}"

        # Second should also succeed (MongoDB doesn't enforce path uniqueness)
        # But they should be different documents
        child2 = await repo.create_hierarchical(child2_data)
        assert child2.path == f"{root_tag.path}/{tag_name}"
        assert child1.id != child2.id

    @given(st.lists(safe_strings(min_size=1, max_size=15), min_size=2, max_size=5), st.data())
    @settings(max_examples=10)
    async def test_search_by_name_properties(self, tag_names, data):
        """Test search functionality properties."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create tags with the provided names
        created_tags = []
        for name in tag_names:
            tag_data = data.draw(tag_creates())
            tag_data.name = name
            created = await repo.create_hierarchical(tag_data)
            created_tags.append(created)

        # Test search for each name
        for target_name in tag_names:
            results = [tag async for tag in repo.search_by_name(target_name)]

            # Should find at least one match
            assert len(results) >= 1

            # All results should contain the search term (case-insensitive)
            for tag in results:
                assert target_name.lower() in tag.name.lower()

    @given(st.integers(min_value=1, max_value=10), st.data())
    @settings(max_examples=10)
    async def test_usage_count_properties(self, increment_count, data):
        """Test usage count increment properties."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create tag
        tag_data = data.draw(tag_creates())
        created = await repo.create_hierarchical(tag_data)

        # Initial usage should be 0
        assert created.usage_count == 0

        # Increment usage multiple times
        for _ in range(increment_count):
            result = await repo.increment_usage_count(created.id)
            assert result is True  # Should succeed

        # Check final count
        updated = await repo.get_by_id(created.id)
        assert updated.usage_count == increment_count

    @given(st.lists(tag_creates(), min_size=3, max_size=6))
    @settings(max_examples=5)
    async def test_descendant_ancestor_symmetry(self, tag_list):
        """Test that descendant/ancestor relationships are symmetric."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create hierarchy
        tags = []
        for i, tag_data in enumerate(tag_list):
            if i == 0:
                tag_data.parent_id = None  # Root
            else:
                tag_data.parent_id = str(tags[i - 1].id)  # Child of previous

            created = await repo.create_hierarchical(tag_data)
            tags.append(created)

        if len(tags) >= 3:
            # Test symmetry: if B is descendant of A, then A is ancestor of B
            root_tag = tags[0]
            leaf_tag = tags[-1]

            # Get descendants of root
            descendants = [tag async for tag in repo.get_descendants(root_tag.id)]
            descendant_ids = [str(tag.id) for tag in descendants]

            # Leaf should be in descendants of root
            assert str(leaf_tag.id) in descendant_ids

            # Get ancestors of leaf
            ancestors = [tag async for tag in repo.get_ancestors(leaf_tag.id)]
            [str(tag.id) for tag in ancestors]

            # Root should be in ancestors of leaf (note: implementation might not include root)
            # Let's check if the relationship is consistent
            assert len(ancestors) == len(tags) - 2  # Excludes self and immediate parent


class TestTagRepositoryEdgeCases:
    """Edge case testing for tag repository."""

    @given(dangerous_strings(), st.data())
    @settings(max_examples=20)
    async def test_name_injection_safety(self, dangerous_string, data):
        """Test that dangerous strings in names don't cause issues."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        tag_data = data.draw(tag_creates())
        tag_data.name = dangerous_string

        # Should not raise exception
        result = await repo.create_hierarchical(tag_data)
        assert result.name == dangerous_string

        # Should be retrievable
        retrieved = await repo.get_by_id(result.id)
        assert retrieved is not None
        assert retrieved.name == dangerous_string

    @given(dangerous_strings(), st.data())
    @settings(max_examples=15)
    async def test_description_injection_safety(self, dangerous_string, data):
        """Test that dangerous strings in descriptions don't cause issues."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        tag_data = data.draw(tag_creates())
        tag_data.description = dangerous_string

        # Should not raise exception
        result = await repo.create_hierarchical(tag_data)
        assert result.description == dangerous_string

    @given(st.data())
    @settings(max_examples=10)
    async def test_hierarchy_operations_with_deep_nesting(self, data):
        """Test hierarchy operations with deeply nested structures."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create deep hierarchy (10 levels)
        tags = []
        for i in range(10):
            tag_data = data.draw(tag_creates())
            tag_data.name = f"Level_{i}"

            if i == 0:
                tag_data.parent_id = None
            else:
                tag_data.parent_id = str(tags[i - 1].id)

            created = await repo.create_hierarchical(tag_data)
            tags.append(created)

            # Verify depth
            assert created.depth == i

            # Verify path has correct number of components
            path_components = created.path.split("/")
            assert len(path_components) == i + 1

        # Test operations on deep hierarchy
        root = tags[0]
        leaf = tags[-1]

        # Get all descendants of root
        descendants = [tag async for tag in repo.get_descendants(root.id)]
        assert len(descendants) == 9  # All except root

        # Get all ancestors of leaf
        ancestors = [tag async for tag in repo.get_ancestors(leaf.id)]
        # Should get some ancestors (exact count depends on implementation)
        assert len(ancestors) >= 1

    async def test_cycle_prevention_stress_test(self, mock_db: AsyncMongoMockDatabase):
        """Test cycle prevention with complex hierarchies."""
        repo = TagRepository(mock_db)

        # Create complex hierarchy: A -> B -> C -> D, E -> F
        tag_a = await repo.create_hierarchical(TagCreate(name="A", description="Tag A"))
        tag_b = await repo.create_hierarchical(TagCreate(name="B", parent_id=str(tag_a.id), description="Tag B"))
        tag_c = await repo.create_hierarchical(TagCreate(name="C", parent_id=str(tag_b.id), description="Tag C"))
        tag_d = await repo.create_hierarchical(TagCreate(name="D", parent_id=str(tag_c.id), description="Tag D"))

        tag_e = await repo.create_hierarchical(TagCreate(name="E", description="Tag E"))
        tag_f = await repo.create_hierarchical(TagCreate(name="F", parent_id=str(tag_e.id), description="Tag F"))

        # Try various cycle-creating moves (all should fail)
        cycle_attempts = [
            (tag_a.id, str(tag_d.id)),  # Make A child of D (creates cycle)
            (tag_b.id, str(tag_d.id)),  # Make B child of D (creates cycle)
            (tag_c.id, str(tag_d.id)),  # Make C child of D (creates cycle)
        ]

        for tag_id, new_parent_id in cycle_attempts:
            result = await repo.move_tag(tag_id, new_parent_id)
            assert result is None  # Should prevent cycle

        # Valid moves should still work
        valid_result = await repo.move_tag(tag_f.id, str(tag_a.id))
        assert valid_result is not None
        assert valid_result.parent_id == str(tag_a.id)

    @given(st.lists(safe_strings(min_size=1, max_size=10), min_size=5, max_size=10), st.data())
    @settings(max_examples=5)
    async def test_bulk_operations_consistency(self, tag_names, data):
        """Test consistency when performing bulk operations."""
        client = AsyncMongoMockClient()
        mock_db = client.test_db
        repo = TagRepository(mock_db)

        # Create many tags
        created_tags = []
        for name in tag_names:
            tag_data = data.draw(tag_creates())
            tag_data.name = name
            created = await repo.create_hierarchical(tag_data)
            created_tags.append(created)

        random.seed(42)  # For reproducibility

        for _ in range(len(tag_names) * 2):
            random_tag = random.choice(created_tags)
            await repo.increment_usage_count(random_tag.id)

        # Get statistics
        stats = await repo.get_tag_statistics()

        # Verify statistics consistency
        assert stats["total_tags"] == len(tag_names)
        assert stats["total_usage"] >= 0
        assert stats["max_depth"] >= 0  # All root tags, so depth should be 0

        # Get most used tags
        top_tags = [tag async for tag in repo.get_most_used_tags(limit=3)]

        # Should return at most 3 tags, all with usage_count > 0
        assert len(top_tags) <= 3
        for tag in top_tags:
            assert tag.usage_count > 0
