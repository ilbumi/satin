"""Base models and utilities."""

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic_core import core_schema


class PyObjectId(str):
    __slots__ = ()

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> core_schema.CoreSchema:
        """Get Pydantic core schema for PyObjectId."""
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.chain_schema(
                        [
                            core_schema.str_schema(),
                            core_schema.no_info_plain_validator_function(cls.validate),
                        ]
                    ),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, value) -> ObjectId:
        """Validate and convert string to ObjectId."""
        if not ObjectId.is_valid(value):
            msg = "Invalid ObjectId"
            raise ValueError(msg)

        return ObjectId(value)


class SatinBaseModel(BaseModel):
    """Base model with common fields."""

    id: PyObjectId | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
