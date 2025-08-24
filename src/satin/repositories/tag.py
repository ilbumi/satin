"""Tag repository with hierarchy support."""

from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase

from satin.models.base import PyObjectId
from satin.models.tag import Tag, TagCreate, TagUpdate

from .base import BaseRepository


class TagRepository(BaseRepository[Tag, TagCreate, TagUpdate]):
    """Repository for Tag operations with hierarchy support."""

    def __init__(self, database: AsyncDatabase):
        """Initialize Tag repository."""
        super().__init__(database, "tags", Tag)

    async def create_hierarchical(self, obj_in: TagCreate) -> Tag:
        """Create a tag with proper hierarchy path and depth."""
        # Calculate hierarchy information
        depth = 0
        path = obj_in.name

        if obj_in.parent_id:
            parent = await self.get_by_id(obj_in.parent_id)
            if parent:
                depth = parent.depth + 1
                path = f"{parent.path}/{obj_in.name}"

        # Create tag with hierarchy data directly
        now = datetime.now(UTC)

        tag_data = obj_in.model_dump(mode="json")
        tag_data["depth"] = depth
        tag_data["path"] = path
        tag_data["usage_count"] = 0
        tag_data["created_at"] = now
        tag_data["updated_at"] = now

        # Create model and insert directly to preserve all fields
        result = await self._collection.insert_one(tag_data)
        tag_data["id"] = result.inserted_id

        return self._model_class(**tag_data)

    async def _recalculate_hierarchy_after_parent_change(
        self, tag_id: PyObjectId | str, new_parent_id: PyObjectId | str | None
    ) -> None:
        """Recalculate hierarchy information after parent change."""
        tag = await self.get_by_id(tag_id)
        if not tag:
            return

        # Calculate new depth and path
        new_depth = 0
        new_path = tag.name

        if new_parent_id:
            parent = await self.get_by_id(new_parent_id)
            if parent:
                new_depth = parent.depth + 1
                new_path = f"{parent.path}/{tag.name}"

        # Update this tag
        await self._collection.update_one(
            {"_id": self._normalize_id(tag_id)}, {"$set": {"depth": new_depth, "path": new_path}}
        )

        # Update all descendants recursively
        async for descendant in self.get_descendants(tag_id):
            descendant_depth = new_depth + (descendant.depth - tag.depth)
            descendant_path = descendant.path.replace(tag.path, new_path, 1)

            await self._collection.update_one(
                {"_id": descendant.id}, {"$set": {"depth": descendant_depth, "path": descendant_path}}
            )

    async def _update_descendant_paths(self, tag_id: PyObjectId | str, new_name: str) -> None:
        """Update paths of all descendants when tag name changes."""
        tag = await self.get_by_id(tag_id)
        if not tag:
            return

        old_path = tag.path
        new_path = old_path.replace(tag.name, new_name)

        # Update all descendants
        async for descendant in self.get_descendants(tag_id):
            descendant_new_path = descendant.path.replace(old_path, new_path, 1)

            await self._collection.update_one({"_id": descendant.id}, {"$set": {"path": descendant_new_path}})

    async def update_hierarchical(self, tag_id: PyObjectId | str, obj_in: TagUpdate) -> Tag | None:
        """Update tag and recalculate hierarchy if parent changed."""
        current = await self.get_by_id(tag_id)
        if not current:
            return None

        # If parent_id is being changed, recalculate hierarchy
        # Check if parent_id field is being updated and is different from current
        update_dict = obj_in.model_dump(exclude_unset=False)
        if "parent_id" in update_dict and obj_in.parent_id != current.parent_id:
            await self._recalculate_hierarchy_after_parent_change(tag_id, obj_in.parent_id)

        # If name is being changed, update paths of all descendants
        if obj_in.name and obj_in.name != current.name:
            await self._update_descendant_paths(tag_id, obj_in.name)

        return await self.update_by_id(tag_id, obj_in)

    async def get_root_tags(self) -> AsyncIterator[Tag]:
        """Get all root tags (tags without parents)."""
        filter_dict = {"parent_id": {"$in": [None, ""]}}
        sort = [("name", ASCENDING)]

        async for tag in self.find_paginated(filter_dict, sort=sort):
            yield tag

    async def get_children(self, parent_id: PyObjectId | str) -> AsyncIterator[Tag]:
        """Get direct children of a tag."""
        filter_dict = {"parent_id": str(parent_id)}
        sort = [("name", ASCENDING)]

        async for tag in self.find_paginated(filter_dict, sort=sort):
            yield tag

    async def get_descendants(self, tag_id: PyObjectId | str) -> AsyncIterator[Tag]:
        """Get all descendants of a tag (recursive)."""
        tag = await self.get_by_id(tag_id)
        if not tag:
            return

        # Find all tags whose path starts with this tag's path
        filter_dict = {"path": {"$regex": f"^{tag.path}/"}, "_id": {"$ne": tag.id}}
        sort = [("depth", ASCENDING), ("name", ASCENDING)]

        async for descendant in self.find_paginated(filter_dict, sort=sort):
            yield descendant

    async def get_ancestors(self, tag_id: PyObjectId | str) -> AsyncIterator[Tag]:
        """Get all ancestors of a tag up to root."""
        tag = await self.get_by_id(tag_id)
        if not tag or not tag.parent_id:
            return

        current_parent_id = tag.parent_id
        while current_parent_id:
            parent = await self.get_by_id(current_parent_id)
            if (not parent) or (parent.parent_id is None):
                break

            yield parent
            current_parent_id = parent.parent_id

    async def get_tree_from_root(self, root_id: PyObjectId | str | None = None) -> AsyncIterator[Tag]:
        """Get complete tag tree starting from root or all roots."""
        if root_id:
            # Get specific root and all its descendants
            root = await self.get_by_id(root_id)
            if root:
                yield root

            async for descendant in self.get_descendants(root_id):
                yield descendant
        else:
            # Get all tags sorted by hierarchy
            sort = [("depth", ASCENDING), ("path", ASCENDING)]
            async for tag in self.find_paginated({}, sort=sort):
                yield tag

    async def get_by_path(self, path: str) -> Tag | None:
        """Get tag by its hierarchical path."""
        return await self.find_one({"path": path})

    async def find_by_depth(self, depth: int) -> AsyncIterator[Tag]:
        """Find all tags at a specific depth level."""
        filter_dict = {"depth": depth}
        sort = [("name", ASCENDING)]

        async for tag in self.find_paginated(filter_dict, sort=sort):
            yield tag

    async def search_by_name(self, name_pattern: str) -> AsyncIterator[Tag]:
        """Search tags by name pattern (case-insensitive)."""
        filter_dict = {"name": {"$regex": name_pattern, "$options": "i"}}
        sort = [("depth", ASCENDING), ("name", ASCENDING)]

        async for tag in self.find_paginated(filter_dict, sort=sort):
            yield tag

    async def get_tag_statistics(self) -> dict[str, Any]:
        """Get tag usage statistics."""
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_tags": {"$sum": 1},
                    "total_usage": {"$sum": "$usage_count"},
                    "max_depth": {"$max": "$depth"},
                    "avg_usage": {"$avg": "$usage_count"},
                }
            }
        ]

        cursor = await self._aggregate_cursor(pipeline)
        async for result in cursor:
            return {
                "total_tags": result["total_tags"],
                "total_usage": result["total_usage"],
                "max_depth": result["max_depth"],
                "avg_usage": round(result["avg_usage"], 2),
            }

        return {"total_tags": 0, "total_usage": 0, "max_depth": 0, "avg_usage": 0}

    async def get_most_used_tags(self, limit: int = 10) -> AsyncIterator[Tag]:
        """Get most frequently used tags."""
        sort = [("usage_count", -1), ("name", ASCENDING)]

        async for tag in self.find_paginated({}, sort=sort, limit=limit):
            yield tag

    async def increment_usage_count(self, tag_id: PyObjectId | str) -> bool:
        """Increment usage count for a tag."""
        result = await self._collection.update_one({"_id": self._normalize_id(tag_id)}, {"$inc": {"usage_count": 1}})
        return result.modified_count > 0

    async def _would_create_cycle(self, tag_id: PyObjectId | str, potential_parent_id: PyObjectId | str) -> bool:
        """Check if moving tag would create a circular reference."""
        # Check if potential_parent_id is a descendant of tag_id
        async for descendant in self.get_descendants(tag_id):
            if str(descendant.id) == str(potential_parent_id):
                return True
        return False

    async def move_tag(self, tag_id: PyObjectId | str, new_parent_id: PyObjectId | str | None) -> Tag | None:
        """Move a tag to a new parent."""
        # Prevent circular references
        if new_parent_id and await self._would_create_cycle(tag_id, new_parent_id):
            return None

        update_data = TagUpdate(parent_id=new_parent_id)
        return await self.update_hierarchical(tag_id, update_data)

    async def delete_with_descendants(self, tag_id: PyObjectId | str) -> int:
        """Delete a tag and all its descendants."""
        # Use the provided tag_id directly instead of relying on tag.id
        normalized_tag_id = self._normalize_id(tag_id)

        # Find all descendants and normalize IDs
        descendant_ids = [normalized_tag_id]
        descendant_ids.extend(
            [self._normalize_id(d.id) async for d in self.get_descendants(tag_id) if d.id is not None]
        )

        # Delete all at once
        filter_dict = {"_id": {"$in": descendant_ids}}
        return await self.delete_many(filter_dict)
