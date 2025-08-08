from enum import Enum

import strawberry

MAX_LIMIT = 1000
MAX_FILTERS_PER_TYPE = 20


@strawberry.enum
class SortDirection(Enum):
    """Sort direction for query results."""

    ASC = "asc"
    DESC = "desc"


@strawberry.enum
class NumberFilterOperator(Enum):
    """Filter operators for numeric fields."""

    EQ = "eq"  # Equal
    NE = "ne"  # Not equal
    GT = "gt"  # Greater than
    LT = "lt"  # Less than
    GTE = "gte"  # Greater than or equal
    LTE = "lte"  # Less than or equal
    IN = "in"  # In list
    NIN = "nin"  # Not in list


@strawberry.enum
class StringFilterOperator(Enum):
    """Filter operators for string fields."""

    EQ = "eq"  # Equal
    NE = "ne"  # Not equal
    CONTAINS = "contains"  # String contains (case-insensitive)
    STARTS_WITH = "starts_with"  # String starts with
    ENDS_WITH = "ends_with"  # String ends with
    REGEX = "regex"  # Regular expression match
    IN = "in"  # In list
    NIN = "nin"  # Not in list


@strawberry.enum
class ListFilterOperator(Enum):
    """Filter operators for list/array fields."""

    CONTAINS = "contains"  # List contains value
    CONTAINS_ALL = "contains_all"  # List contains all values
    CONTAINS_ANY = "contains_any"  # List contains any of the values
    SIZE_EQ = "size_eq"  # List size equals
    SIZE_GT = "size_gt"  # List size greater than
    SIZE_LT = "size_lt"  # List size less than


@strawberry.input
class SortInput:
    """Sort specification for a field."""

    field: str
    direction: SortDirection = SortDirection.ASC


@strawberry.input
class NumberFilterInput:
    """Filter specification for numeric fields."""

    field: str
    operator: NumberFilterOperator
    value: strawberry.scalars.JSON  # type: ignore[valid-type]


@strawberry.input
class StringFilterInput:
    """Filter specification for string fields."""

    field: str
    operator: StringFilterOperator
    value: strawberry.scalars.JSON  # type: ignore[valid-type]


@strawberry.input
class ListFilterInput:
    """Filter specification for list/array fields."""

    field: str
    operator: ListFilterOperator
    value: strawberry.scalars.JSON  # type: ignore[valid-type]


@strawberry.input
class QueryInput:
    """Universal query input with filtering, sorting, and pagination."""

    number_filters: list[NumberFilterInput] | None = None
    string_filters: list[StringFilterInput] | None = None
    list_filters: list[ListFilterInput] | None = None
    sorts: list[SortInput] | None = None
    limit: int = 10
    offset: int = 0

    def __post_init__(self) -> None:
        """Validate query input constraints."""
        if self.limit and self.limit > MAX_LIMIT:
            msg = f"Limit cannot exceed {MAX_LIMIT}"
            raise ValueError(msg)

        if self.limit and self.limit < 0:
            msg = "Limit cannot be negative"
            raise ValueError(msg)

        if self.offset < 0:
            msg = "Offset cannot be negative"
            raise ValueError(msg)

        # Count total filters
        filter_counts = [
            len(self.number_filters or []),
            len(self.string_filters or []),
            len(self.list_filters or []),
            len(self.sorts or []),
        ]

        if any(count > MAX_FILTERS_PER_TYPE for count in filter_counts):
            msg = f"Too many filters/sorts specified (max {MAX_FILTERS_PER_TYPE} per type)"
            raise ValueError(msg)
