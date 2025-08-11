"""Pydantic models for filter and query types."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

from satin.constants import MAX_FILTER_LIST_SIZE, MAX_FILTERS_PER_TYPE, MAX_QUERY_LIMIT
from satin.exceptions import FilterValidationError
from satin.validators import sanitize_string, validate_field_name


class SortDirection(Enum):
    """Sort direction for query results."""

    ASC = "asc"
    DESC = "desc"


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


class ListFilterOperator(Enum):
    """Filter operators for list/array fields."""

    CONTAINS = "contains"  # List contains value
    CONTAINS_ALL = "contains_all"  # List contains all values
    CONTAINS_ANY = "contains_any"  # List contains any of the values
    SIZE_EQ = "size_eq"  # List size equals
    SIZE_GT = "size_gt"  # List size greater than
    SIZE_LT = "size_lt"  # List size less than


class SortModel(BaseModel):
    """Sort specification for a field."""

    field: str = Field(..., description="Field name to sort by")
    direction: SortDirection = Field(default=SortDirection.ASC, description="Sort direction")

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        """Validate field name."""
        return validate_field_name(v)


class NumberFilterModel(BaseModel):
    """Filter specification for numeric fields."""

    field: str = Field(..., description="Field name to filter")
    operator: NumberFilterOperator = Field(..., description="Filter operator")
    value: int | float | list[int | float] = Field(..., description="Filter value(s)")

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        """Validate field name."""
        return validate_field_name(v)

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float | list[int | float], info: Any) -> int | float | list[int | float]:
        """Validate filter value based on operator."""
        # Get the operator from the field info
        operator = info.data.get("operator") if hasattr(info, "data") else None

        # Handle list operators (IN, NIN)
        if operator in {NumberFilterOperator.IN, NumberFilterOperator.NIN}:
            if not isinstance(v, list):
                v = [v]

            # Validate each item is numeric
            for item in v:
                if not isinstance(item, (int, float)):
                    raise FilterValidationError.numeric_filter_invalid(type(item).__name__)

            # Limit list size to prevent DoS
            if len(v) > MAX_FILTER_LIST_SIZE:
                raise FilterValidationError.filter_list_too_large(MAX_FILTER_LIST_SIZE)

        # Handle single value operators
        elif isinstance(v, list):
            invalid_type = "list"
            raise FilterValidationError.numeric_filter_invalid(invalid_type)
        elif not isinstance(v, (int, float)):
            raise FilterValidationError.numeric_filter_invalid(type(v).__name__)

        return v


class StringFilterModel(BaseModel):
    """Filter specification for string fields."""

    field: str = Field(..., description="Field name to filter")
    operator: StringFilterOperator = Field(..., description="Filter operator")
    value: str | list[str] = Field(..., description="Filter value(s)")

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        """Validate field name."""
        return validate_field_name(v)

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: str | list[str], info: Any) -> str | list[str]:
        """Validate and sanitize filter value based on operator."""
        # Get the operator from the field info
        operator = info.data.get("operator") if hasattr(info, "data") else None

        # Handle list operators (IN, NIN)
        if operator in {StringFilterOperator.IN, StringFilterOperator.NIN}:
            if not isinstance(v, list):
                v = [v]

            # Limit list size and sanitize each value
            if len(v) > MAX_FILTER_LIST_SIZE:
                raise FilterValidationError.filter_list_too_large(MAX_FILTER_LIST_SIZE)

            return [sanitize_string(str(item), max_length=1000) for item in v]

        # Handle single value operators
        if isinstance(v, list):
            v = str(v[0]) if v else ""
        return sanitize_string(str(v), max_length=1000)


class ListFilterModel(BaseModel):
    """Filter specification for list/array fields."""

    field: str = Field(..., description="Field name to filter")
    operator: ListFilterOperator = Field(..., description="Filter operator")
    value: Any | list[Any] = Field(..., description="Filter value(s)")

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        """Validate field name."""
        return validate_field_name(v)

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: Any, info: Any) -> Any:
        """Validate filter value based on operator."""
        # Get the operator from the field info
        operator = info.data.get("operator") if hasattr(info, "data") else None

        # Handle list operators (CONTAINS_ALL, CONTAINS_ANY)
        if operator in {ListFilterOperator.CONTAINS_ALL, ListFilterOperator.CONTAINS_ANY}:
            if not isinstance(v, list):
                v = [v]

            # Limit list size
            if len(v) > MAX_FILTER_LIST_SIZE:
                raise FilterValidationError.filter_list_too_large(MAX_FILTER_LIST_SIZE)

        return v


class QueryModel(BaseModel):
    """Universal query input with filtering, sorting, and pagination."""

    number_filters: list[NumberFilterModel] = Field(
        default_factory=list, description="Numeric field filters", max_length=MAX_FILTERS_PER_TYPE
    )
    string_filters: list[StringFilterModel] = Field(
        default_factory=list, description="String field filters", max_length=MAX_FILTERS_PER_TYPE
    )
    list_filters: list[ListFilterModel] = Field(
        default_factory=list, description="List field filters", max_length=MAX_FILTERS_PER_TYPE
    )
    sorts: list[SortModel] = Field(
        default_factory=list, description="Sort specifications", max_length=MAX_FILTERS_PER_TYPE
    )
    limit: int = Field(default=10, ge=0, le=MAX_QUERY_LIMIT, description="Maximum number of results")
    offset: int = Field(default=0, ge=0, description="Number of results to skip")

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v: int) -> int:
        """Validate limit value."""
        if v > MAX_QUERY_LIMIT:
            msg = f"Limit cannot exceed {MAX_QUERY_LIMIT}"
            raise ValueError(msg)
        if v < 0:
            msg = "Limit cannot be negative"
            raise ValueError(msg)
        return v

    @field_validator("offset")
    @classmethod
    def validate_offset(cls, v: int) -> int:
        """Validate offset value."""
        if v < 0:
            msg = "Offset cannot be negative"
            raise ValueError(msg)
        return v
