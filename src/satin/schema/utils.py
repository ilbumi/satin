"""Utility functions for schema operations."""

import re
from typing import Any, TypeVar, get_type_hints

import strawberry

from satin.exceptions import ValidationError as BaseValidationError
from satin.schema.filters import ListFilterOperator, NumberFilterOperator, StringFilterOperator
from satin.validators import _validate_regex_pattern, validate_and_convert_object_id

# Type conversion utilities
T = TypeVar("T")


def get_model_fields(model_class: type) -> dict[str, type]:
    """Get all fields and their types for a Strawberry model."""
    try:
        return get_type_hints(model_class)
    except (NameError, AttributeError):
        # Fallback to annotations if type hints fail
        return getattr(model_class, "__annotations__", {})


def is_valid_field(model_class: type, field_name: str) -> bool:
    """Check if a field name is valid for the given model."""
    fields = get_model_fields(model_class)
    # Support dot notation for nested fields (e.g., "image.url", "project.name")
    if "." in field_name:
        base_field = field_name.split(".")[0]
        return base_field in fields
    return field_name in fields


def convert_filter_value(value: Any, target_type: type) -> Any:
    """Convert filter value to the appropriate type for MongoDB queries."""
    if value is None:
        return None

    if isinstance(value, list):
        return [convert_filter_value(v, target_type) for v in value]

    # Handle ObjectId conversion for ID fields
    if target_type in {strawberry.ID, "ID"} or str(target_type).endswith("ID"):
        if isinstance(value, str):
            try:
                return validate_and_convert_object_id(value)
            except BaseValidationError:
                # Return the original value if validation fails
                # This allows for non-ObjectId IDs in some cases
                return value
        return value

    # Handle basic type conversions
    type_converters = {
        int: lambda v: int(v) if isinstance(v, (str, float)) else v,
        float: lambda v: float(v) if isinstance(v, (str, int)) else v,
        str: lambda v: str(v) if not isinstance(v, str) else v,
        bool: lambda v: (v.lower() in ("true", "1", "yes", "on") if isinstance(v, str) else bool(v)),
    }
    return type_converters.get(target_type, lambda v: v)(value)


def _build_number_filter(field: str, operator: NumberFilterOperator, value: Any) -> dict[str, Any]:
    """Build MongoDB filter condition for numeric fields."""
    list_operators = {NumberFilterOperator.IN: "$in", NumberFilterOperator.NIN: "$nin"}
    single_operators = {
        NumberFilterOperator.EQ: None,
        NumberFilterOperator.NE: "$ne",
        NumberFilterOperator.GT: "$gt",
        NumberFilterOperator.LT: "$lt",
        NumberFilterOperator.GTE: "$gte",
        NumberFilterOperator.LTE: "$lte",
    }
    if operator in list_operators:
        value_list = value if isinstance(value, list) else [value]
        return {field: {list_operators[operator]: value_list}}
    if operator in single_operators:
        mongo_operator = single_operators[operator]
        return {field: value if mongo_operator is None else {mongo_operator: value}}

    msg = f"Unsupported number operator: {operator}"
    raise ValueError(msg)


def _build_string_filter(field: str, operator: StringFilterOperator, value: Any) -> dict[str, Any]:
    """Build MongoDB filter condition for string fields."""
    str_value = str(value)

    # Validate regex patterns for security
    if operator == StringFilterOperator.REGEX:
        _validate_regex_pattern(str_value)

    regex_operators = {
        StringFilterOperator.CONTAINS: {"$regex": re.escape(str_value), "$options": "i"},
        StringFilterOperator.STARTS_WITH: {"$regex": f"^{re.escape(str_value)}", "$options": "i"},
        StringFilterOperator.ENDS_WITH: {"$regex": f"{re.escape(str_value)}$", "$options": "i"},
        StringFilterOperator.REGEX: {"$regex": str_value},
    }
    list_operators = {StringFilterOperator.IN: "$in", StringFilterOperator.NIN: "$nin"}

    if operator in regex_operators:
        return {field: regex_operators[operator]}
    if operator in list_operators:
        value_list = value if isinstance(value, list) else [value]
        return {field: {list_operators[operator]: value_list}}
    if operator in {StringFilterOperator.EQ, StringFilterOperator.NE}:
        return {field: value if operator == StringFilterOperator.EQ else {"$ne": value}}

    msg = f"Unsupported string operator: {operator}"
    raise ValueError(msg)


def _build_list_filter(field: str, operator: ListFilterOperator, value: Any) -> dict[str, Any]:
    """Build MongoDB filter condition for list/array fields."""
    list_operators: dict[ListFilterOperator, Any] = {
        ListFilterOperator.CONTAINS: value,
        ListFilterOperator.CONTAINS_ALL: {"$all": value if isinstance(value, list) else [value]},
        ListFilterOperator.CONTAINS_ANY: {"$in": value if isinstance(value, list) else [value]},
    }
    size_operators: dict[ListFilterOperator, dict[str, Any]] = {
        ListFilterOperator.SIZE_EQ: {"$size": int(value)},
        ListFilterOperator.SIZE_GT: {f"{field}.{int(value)}": {"$exists": True}},
        ListFilterOperator.SIZE_LT: ({f"{field}.{int(value) - 1}": {"$exists": False}} if int(value) > 0 else {}),
    }

    if operator in list_operators:
        return {field: list_operators[operator]}
    if operator in size_operators:
        return size_operators[operator]

    msg = f"Unsupported list operator: {operator}"
    raise ValueError(msg)


def build_mongodb_filter_condition(
    field: str, operator: NumberFilterOperator | StringFilterOperator | ListFilterOperator, value: Any
) -> dict[str, Any]:
    """Build MongoDB filter condition from filter input."""
    if isinstance(operator, NumberFilterOperator):
        return _build_number_filter(field, operator, value)
    if isinstance(operator, StringFilterOperator):
        return _build_string_filter(field, operator, value)
    if isinstance(operator, ListFilterOperator):
        return _build_list_filter(field, operator, value)

    msg = f"Unsupported operator type: {type(operator)}"
    raise ValueError(msg)


def build_mongodb_sort_condition(field: str, direction: str) -> tuple[str, int]:
    """Build MongoDB sort condition from sort input."""
    sort_direction = 1 if direction.lower() == "asc" else -1
    return (field, sort_direction)
