"""Tests for TagRepository with hierarchy support."""

import pytest
from mongomock_motor import AsyncMongoMockDatabase

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
