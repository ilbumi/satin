import asyncio
from abc import ABC, abstractmethod
from typing import Any, TypeVar

import strawberry
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

T = TypeVar("T")


class BaseRepository[T](ABC):
    """Base repository class with common database operations."""

    def __init__(self, db: AsyncDatabase, collection_name: str):
        """Initialize the repository with a database connection and collection name."""
        self.db = db
        self.collection_name = collection_name
        self.collection = db[collection_name]

    def _convert_id(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert MongoDB _id to id field."""
        if data and "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        return data

    async def find_by_id(self, object_id: strawberry.ID) -> dict[str, Any] | None:
        """Find a document by its ID."""
        return await self.collection.find_one({"_id": ObjectId(object_id)})

    async def find_all(self, limit: int | None = None, offset: int = 0) -> list[dict[str, Any]]:
        """Find all documents with pagination using aggregation pipeline."""
        pipeline: list[dict[str, Any]] = [
            {"$skip": offset},
            {"$limit": limit if limit is not None else 1000},
            {
                "$addFields": {
                    "id": {"$toString": "$_id"},
                }
            },
        ]

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

    async def count_all(self, filter_query: dict[str, Any] | None = None) -> int:
        """Count total documents in the collection."""
        if filter_query is None:
            filter_query = {}
        return await self.collection.count_documents(filter_query)

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new document."""
        result = await self.collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        data.pop("_id", None)
        return data

    async def update_by_id(self, object_id: strawberry.ID, update_data: dict[str, Any]) -> bool:
        """Update a document by its ID."""
        if not update_data:
            return False

        result = await self.collection.update_one({"_id": ObjectId(object_id)}, {"$set": update_data})
        return result.modified_count > 0

    async def delete_by_id(self, object_id: strawberry.ID) -> bool:
        """Delete a document by its ID."""
        result = await self.collection.delete_one({"_id": ObjectId(object_id)})
        return result.deleted_count > 0

    @abstractmethod
    async def to_domain_object(self, data: dict[str, Any]) -> T:
        """Convert database document to domain object."""
