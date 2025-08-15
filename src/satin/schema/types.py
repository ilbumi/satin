"""Proper type definitions for GraphQL schema without type ignore comments."""

from typing import TYPE_CHECKING, Any, Protocol, TypeVar, runtime_checkable

if TYPE_CHECKING:
    from satin.models.filters import QueryModel
    from satin.schema.image import Image
    from satin.schema.project import Project
    from satin.schema.task import Task

# Type variable for generic conversions
T = TypeVar("T")


@runtime_checkable
class QueryInputProtocol(Protocol):
    """Protocol for runtime query input validation."""

    limit: int
    offset: int
    number_filters: Any
    string_filters: Any
    list_filters: Any
    sorts: Any


@runtime_checkable
class StrawberryTypeProtocol(Protocol):
    """Protocol for Strawberry types with from_pydantic method."""

    @classmethod
    def from_pydantic(cls, _: Any, __: dict[str, Any] | None = None) -> Any:
        """Convert from Pydantic model."""
        ...


# Type aliases for static analysis
if TYPE_CHECKING:
    QueryInputType = QueryModel
    ProjectType = Project
    ImageType = Image
    TaskType = Task
else:
    QueryInputType = Any
    ProjectType = Any
    ImageType = Any
    TaskType = Any
