"""Pagination types and utilities for GraphQL API."""

import base64
from enum import IntEnum
from typing import TypeVar

import strawberry

T = TypeVar("T")


@strawberry.type
class PageInfo:
    """Information about pagination state."""

    has_next_page: bool
    has_previous_page: bool
    start_cursor: str | None = None
    end_cursor: str | None = None
    total_count: int


@strawberry.input
class PaginationInput:
    """Input for pagination parameters."""

    limit: int = strawberry.field(default=20, description="Number of items to return")
    offset: int = strawberry.field(default=0, description="Number of items to skip")


@strawberry.enum
class SortOrder(IntEnum):
    """Enum for sort order."""

    ASC = 1
    DESC = -1


@strawberry.input
class SortInput:
    """Input for sorting parameters."""

    field: str = strawberry.field(description="Field to sort by")
    order: SortOrder = strawberry.field(default=SortOrder.ASC, description="Sort order")


@strawberry.type
class Connection[T]:
    """Generic connection type for paginated results."""

    items: list[T]
    page_info: PageInfo
    total_count: int


def encode_cursor(value: str) -> str:
    """Encode a cursor value to base64."""
    return base64.b64encode(value.encode()).decode()


def decode_cursor(cursor: str) -> str:
    """Decode a base64 cursor value."""
    return base64.b64decode(cursor.encode()).decode()


def get_sort_direction(order: SortOrder) -> int:
    """Get MongoDB sort direction from SortOrder enum."""
    return order.value
