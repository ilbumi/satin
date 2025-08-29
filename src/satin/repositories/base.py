"""Base repository class for MongoDB operations with async iterators."""

import asyncio
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any, TypeVar

from bson import ObjectId
from pydantic import BaseModel, validate_call
from pymongo import ReturnDocument, UpdateOne
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from satin.logging import LoggingMixin
from satin.models.base import PyObjectId, SatinBaseModel

ModelType = TypeVar("ModelType", bound=SatinBaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository[ModelType: SatinBaseModel, CreateSchemaType: BaseModel, UpdateSchemaType: BaseModel](LoggingMixin):
    """Base repository for CRUD operations with async iterators."""

    def __init__(self, database: AsyncDatabase, collection_name: str, model_class: type[ModelType]):
        """Initialize repository.

        Args:
            database: MongoDB database instance
            collection_name: Name of the collection
            model_class: Pydantic model class for this repository

        """
        super().__init__()
        self._database = database
        self._collection: AsyncCollection = database.get_collection(collection_name)
        self._model_class = model_class
        self._collection_name = collection_name

    @property
    def collection(self) -> AsyncCollection:
        """Get the MongoDB collection."""
        return self._collection

    def _normalize_id(self, id_value: PyObjectId) -> ObjectId:
        """Convert PyObjectId to ObjectId."""
        return ObjectId(str(id_value))

    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create a new document."""
        log = self._log_operation("create")

        obj_data = obj_in.model_dump(mode="json")
        now = datetime.now(UTC)
        obj_data["created_at"] = now
        obj_data["updated_at"] = now

        model = self._model_class(**obj_data)
        # Don't use mode="json" when dumping for MongoDB to preserve ObjectId types
        result = await self._collection.insert_one(model.model_dump(by_alias=True, exclude_none=True))
        model.id = result.inserted_id

        log.info("document_created", document_id=str(result.inserted_id))
        return model

    async def bulk_create(self, objects: list[CreateSchemaType]) -> list[ModelType]:
        """Create multiple documents efficiently."""
        if not objects:
            return []

        now = datetime.now(UTC)
        docs = []
        for obj in objects:
            obj_data = obj.model_dump(mode="json")
            obj_data["created_at"] = now
            obj_data["updated_at"] = now
            docs.append(self._model_class(**obj_data).model_dump(mode="json"))

        result = await self._collection.insert_many(docs)

        # Add inserted IDs back to documents
        for doc, inserted_id in zip(docs, result.inserted_ids, strict=False):
            doc["_id"] = inserted_id

        return [self._model_class(**doc) for doc in docs]

    @validate_call
    async def get_by_id(self, id_value: PyObjectId) -> ModelType | None:
        """Get document by ID."""
        log = self._log_operation("get_by_id", document_id=str(id_value))

        object_id = self._normalize_id(id_value)

        document = await self._collection.find_one({"_id": object_id})

        if document:
            log.debug("document_found")
            return self._model_class(**document)

        log.debug("document_not_found")
        return None

    async def find_one(self, filter_dict: dict[str, Any]) -> ModelType | None:
        """Get single document by filter."""
        document = await self._collection.find_one(filter_dict)
        if document:
            return self._model_class(**document)
        return None

    async def find(self, filter_dict: dict[str, Any] | None = None) -> AsyncIterator[ModelType]:
        """Find documents and return async iterator."""
        if filter_dict is None:
            filter_dict = {}

        cursor = self._collection.find(filter_dict)
        async for document in cursor:
            yield self._model_class(**document)

    async def find_paginated(
        self,
        filter_dict: dict[str, Any] | None = None,
        skip: int = 0,
        limit: int = 100,
        sort: list[tuple[str, int]] | None = None,
    ) -> AsyncIterator[ModelType]:
        """Find documents with pagination and return async iterator."""
        if filter_dict is None:
            filter_dict = {}

        cursor = self._collection.find(filter_dict)

        if sort:
            cursor = cursor.sort(sort)

        cursor = cursor.skip(skip).limit(limit)

        async for document in cursor:
            yield self._model_class(**document)

    async def find_paginated_with_count(
        self,
        filter_dict: dict[str, Any] | None = None,
        skip: int = 0,
        limit: int = 100,
        sort: list[tuple[str, int]] | None = None,
    ) -> tuple[list[ModelType], int]:
        """Find documents with pagination and return list with total count.

        Returns:
            Tuple of (items, total_count)

        """
        if filter_dict is None:
            filter_dict = {}

        # Get total count
        total_count = await self.count(filter_dict)

        # Get paginated items
        items = [item async for item in self.find_paginated(filter_dict, skip, limit, sort)]

        return items, total_count

    async def _aggregate_cursor(self, pipeline: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """Run aggregation pipeline and return cursor.

        Use this instead of directly calling self._collection.aggregate.
        """
        res = self._collection.aggregate(pipeline)
        if asyncio.iscoroutine(res):  # for testing
            cursor = await res
        else:
            cursor = res
        return cursor  # type: ignore[return-value]

    async def aggregate(self, pipeline: list[dict[str, Any]]) -> AsyncIterator[ModelType]:
        """Run aggregation pipeline and return async iterator."""
        cursor = await self._aggregate_cursor(pipeline)
        async for document in cursor:
            yield self._model_class(**document)

    @validate_call
    async def update_by_id(self, id_value: PyObjectId, obj_in: UpdateSchemaType) -> ModelType | None:
        """Update document by ID and return updated document."""
        log = self._log_operation("update_by_id", document_id=str(id_value))

        object_id = self._normalize_id(id_value)

        update_data = obj_in.model_dump(exclude_unset=True)

        if not update_data:
            log.debug("no_updates_provided")
            return await self.get_by_id(id_value)  # type: ignore[no-any-return]

        update_data["updated_at"] = datetime.now(UTC)

        document = await self._collection.find_one_and_update(
            {"_id": object_id},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )

        if document:
            log.info("document_updated")
            return self._model_class(**document)

        log.warning("document_not_found")
        return None

    async def bulk_update(self, updates: list[tuple[dict[str, Any], UpdateSchemaType]]) -> int:
        """Update multiple documents efficiently.

        Args:
            updates: List of (filter, update_data) tuples

        Returns:
            Number of documents modified

        """
        if not updates:
            return 0

        operations: list[UpdateOne] = []
        now = datetime.now(UTC)

        for filter_dict, obj_in in updates:
            update_data = obj_in.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = now
                operations.append(UpdateOne(filter=filter_dict, update={"$set": update_data}))

        if not operations:
            return 0

        result = await self._collection.bulk_write(operations)
        return result.modified_count

    @validate_call
    async def delete_by_id(self, id_value: PyObjectId) -> bool:
        """Delete document by ID."""
        log = self._log_operation("delete_by_id", document_id=str(id_value))

        object_id = self._normalize_id(id_value)

        result = await self._collection.delete_one({"_id": object_id})

        if result.deleted_count > 0:
            log.info("document_deleted")
            return True

        log.warning("document_not_found")
        return False

    async def delete_many(self, filter_dict: dict[str, Any]) -> int:
        """Delete multiple documents matching filter.

        Returns:
            Number of documents deleted

        """
        result = await self._collection.delete_many(filter_dict)
        return result.deleted_count

    async def count(self, filter_dict: dict[str, Any] | None = None) -> int:
        """Count documents matching filter."""
        if filter_dict is None:
            filter_dict = {}
        return await self._collection.count_documents(filter_dict)

    async def exists(self, filter_dict: dict[str, Any]) -> bool:
        """Check if document exists matching filter."""
        document = await self._collection.find_one(filter_dict, {"_id": 1})
        return document is not None
