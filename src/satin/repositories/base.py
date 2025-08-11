import asyncio
import time
from abc import ABC, abstractmethod
from typing import Any, TypeVar

import strawberry
from pymongo.asynchronous.database import AsyncDatabase

from satin.schema.utils import build_mongodb_filter_condition, build_mongodb_sort_condition
from satin.validators import ValidationError, validate_and_convert_object_id

T = TypeVar("T")


class BaseRepository[T](ABC):
    """Base repository class with common database operations."""

    def __init__(self, db: AsyncDatabase, collection_name: str):
        """Initialize the repository with a database connection and collection name."""
        self.db = db
        self.collection_name = collection_name
        self.collection = db[collection_name]
        # Simple in-memory cache for single-user application
        self._cache: dict[str, tuple[Any, float]] = {}  # key -> (value, timestamp)
        self._cache_ttl = 300  # 5 minutes TTL
        self._cache_max_size = 100

    def _convert_id(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert MongoDB _id to id field."""
        if data and "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        return data

    def _cache_key(self, method: str, **kwargs) -> str:
        """Generate cache key from method and parameters."""
        key_parts = [self.collection_name, method] + [f"{k}:{v}" for k, v in sorted(kwargs.items())]
        return "|".join(key_parts)

    def _get_cached(self, cache_key: str) -> Any | None:
        """Get value from cache if not expired."""
        if cache_key not in self._cache:
            return None

        value, timestamp = self._cache[cache_key]
        if time.time() - timestamp > self._cache_ttl:
            # Expired, remove from cache
            del self._cache[cache_key]
            return None

        return value

    def _set_cache(self, cache_key: str, value: Any) -> None:
        """Set value in cache with timestamp."""
        if value is None:
            return

        # Simple cache size management
        if len(self._cache) >= self._cache_max_size:
            # Remove oldest entries (simple FIFO)
            oldest_keys = list(self._cache.keys())[:20]
            for key in oldest_keys:
                del self._cache[key]

        self._cache[cache_key] = (value, time.time())

    def _invalidate_cache(self, pattern: str | None = None) -> None:
        """Invalidate cache entries by pattern or clear all."""
        if pattern is None:
            self._cache.clear()
        else:
            keys_to_remove = [k for k in self._cache if pattern in k]
            for key in keys_to_remove:
                del self._cache[key]

    async def find_by_id(self, object_id: strawberry.ID) -> dict[str, Any] | None:
        """Find a document by its ID with caching."""
        cache_key = self._cache_key("find_by_id", object_id=str(object_id))

        # Try cache first
        cached_result = self._get_cached(cache_key)
        if cached_result is not None:
            if not isinstance(cached_result, dict):
                msg = "Cached result is not a valid document"
                raise TypeError(msg)
            return cached_result

        try:
            validated_id = validate_and_convert_object_id(object_id)
            result = await self.collection.find_one({"_id": validated_id})

            # Cache the result
            self._set_cache(cache_key, result)
        except ValidationError:
            # Return None for invalid IDs instead of raising an error
            # This maintains backward compatibility while preventing injection
            return None
        else:
            return result

    def build_match_stage(self, query_input) -> dict[str, Any]:  # QueryModel | None
        """Build MongoDB match stage from query input filters."""
        if not query_input:
            return {}

        match_conditions = []

        # Handle number filters
        if query_input.number_filters:
            for number_filter_input in query_input.number_filters:
                condition = build_mongodb_filter_condition(
                    number_filter_input.field, number_filter_input.operator, number_filter_input.value
                )
                match_conditions.append(condition)

        # Handle string filters
        if query_input.string_filters:
            for string_filter_input in query_input.string_filters:
                condition = build_mongodb_filter_condition(
                    string_filter_input.field, string_filter_input.operator, string_filter_input.value
                )
                match_conditions.append(condition)

        # Handle list filters
        if query_input.list_filters:
            for list_filter_input in query_input.list_filters:
                condition = build_mongodb_filter_condition(
                    list_filter_input.field, list_filter_input.operator, list_filter_input.value
                )
                match_conditions.append(condition)

        # Combine all conditions with $and if multiple conditions exist
        if not match_conditions:
            return {}
        if len(match_conditions) == 1:
            return match_conditions[0]
        return {"$and": match_conditions}

    def build_sort_stage(self, query_input) -> dict[str, Any]:  # QueryModel | None
        """Build MongoDB sort stage from query input sorts."""
        if not query_input or not query_input.sorts:
            return {}

        sort_dict = {}
        for sort_input in query_input.sorts:
            field, direction = build_mongodb_sort_condition(sort_input.field, sort_input.direction.value)
            sort_dict[field] = direction

        return sort_dict

    async def find_all(
        self,
        limit: int | None = None,
        offset: int = 0,
        query_input=None,  # QueryModel | None
    ) -> list[dict[str, Any]]:
        """Find all documents with filtering, sorting, and pagination using aggregation pipeline."""
        pipeline: list[dict[str, Any]] = []

        # Add match stage for filters
        match_stage = self.build_match_stage(query_input)
        if match_stage:
            pipeline.append({"$match": match_stage})

        # Add sort stage
        sort_stage = self.build_sort_stage(query_input)
        if sort_stage:
            pipeline.append({"$sort": sort_stage})

        # Use query_input pagination if provided, otherwise use parameters
        if query_input:
            pipeline.extend(
                [
                    {"$skip": query_input.offset},
                    {"$limit": query_input.limit if query_input.limit else 1000},
                ]
            )
        else:
            pipeline.extend(
                [
                    {"$skip": offset},
                    {"$limit": limit if limit is not None else 1000},
                ]
            )

        # Add ID conversion
        pipeline.append(
            {
                "$addFields": {
                    "id": {"$toString": "$_id"},
                }
            }
        )

        results: list[dict[str, Any]] = []
        opt_cursor = self.collection.aggregate(pipeline)
        if asyncio.iscoroutine(opt_cursor):
            cursor = await opt_cursor
        else:
            cursor = opt_cursor  # Handle sync cursor for testing

        async for document in cursor:
            document.pop("_id", None)
            results.append(document)

        return results

    async def count_all(self, filter_query: dict[str, Any] | None = None, query_input=None) -> int:  # QueryModel | None
        """Count total documents in the collection."""
        if query_input:
            # Use query_input filters for counting
            match_stage = self.build_match_stage(query_input)
            return await self.collection.count_documents(match_stage)
        # Use legacy filter_query parameter
        if filter_query is None:
            filter_query = {}
        return await self.collection.count_documents(filter_query)

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new document."""
        result = await self.collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        data.pop("_id", None)

        # Invalidate relevant cache entries
        self._invalidate_cache(self.collection_name)

        return data

    async def update_by_id(self, object_id: strawberry.ID, update_data: dict[str, Any]) -> bool:
        """Update a document by its ID."""
        if not update_data:
            return False

        try:
            validated_id = validate_and_convert_object_id(object_id)
            result = await self.collection.update_one({"_id": validated_id}, {"$set": update_data})

            # Invalidate cache for this specific item and collection
            if result.modified_count > 0:
                self._invalidate_cache(f"find_by_id|object_id:{object_id}")
                self._invalidate_cache(self.collection_name)

        except ValidationError:
            return False
        else:
            return result.modified_count > 0

    async def delete_by_id(self, object_id: strawberry.ID) -> bool:
        """Delete a document by its ID."""
        try:
            validated_id = validate_and_convert_object_id(object_id)
            result = await self.collection.delete_one({"_id": validated_id})

            # Invalidate cache for this specific item and collection
            if result.deleted_count > 0:
                self._invalidate_cache(f"find_by_id|object_id:{object_id}")
                self._invalidate_cache(self.collection_name)
        except ValidationError:
            return False
        else:
            return result.deleted_count > 0

    @abstractmethod
    async def to_domain_object(self, data: dict[str, Any]) -> T:
        """Convert database document to domain object."""
