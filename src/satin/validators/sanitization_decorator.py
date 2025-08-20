"""Decorators for automatic input sanitization in GraphQL mutations."""

import functools
import inspect
import logging
from collections.abc import Callable
from typing import Any, cast

import strawberry

from satin.validators.input_sanitizer import (
    sanitize_string,
    validate_and_convert_object_id,
    validate_description,
    validate_project_name,
    validate_tags,
    validate_url,
)

logger = logging.getLogger(__name__)

# Mapping of parameter names to their sanitization functions
SANITIZATION_RULES: dict[str, Callable[[Any], Any]] = {
    "name": validate_project_name,
    "description": validate_description,
    "url": lambda x: validate_url(x, allow_local=True),  # Allow local URLs for development
    "tags": validate_tags,
    "project_name": validate_project_name,
    "image_url": lambda x: validate_url(x, allow_local=True),
}

# Parameters that should be treated as ObjectIds
OBJECT_ID_PARAMS = {"id", "project_id", "image_id", "task_id"}

# Parameters that should be sanitized as strings (if not caught by specific rules)
STRING_PARAMS = {"title", "comment", "note", "filename"}


def _sanitize_list_parameter(param_name: str, param_value: list[Any]) -> list[Any]:
    """Sanitize a list parameter based on its name and content.

    Args:
        param_name: Name of the parameter
        param_value: List value to sanitize

    Returns:
        Sanitized list parameter value

    """
    # For lists, we need to check the content type
    if param_name.endswith("_ids") and param_value:
        # List of IDs
        logger.debug("Sanitized list of IDs for %s", param_name)
        return [
            validate_and_convert_object_id(item)
            if isinstance(item, str)
            or (hasattr(strawberry, "ID") and hasattr(item, "__class__") and item.__class__.__name__ == "ID")
            else item
            for item in param_value
        ]
    # Other lists - pass through for now
    return param_value


def _sanitize_parameter(param_name: str, param_value: Any) -> Any:
    """Sanitize a single parameter based on its name and value.

    Args:
        param_name: Name of the parameter
        param_value: Value to sanitize

    Returns:
        Sanitized parameter value

    """
    # Apply specific sanitization rules
    if param_name in SANITIZATION_RULES:
        logger.debug("Applied specific sanitization to %s", param_name)
        return SANITIZATION_RULES[param_name](param_value)

    # Handle ObjectId parameters
    if param_name in OBJECT_ID_PARAMS:
        is_string = isinstance(param_value, str)
        is_strawberry_id = (
            hasattr(strawberry, "ID") and hasattr(param_value, "__class__") and param_value.__class__.__name__ == "ID"
        )
        if is_string or is_strawberry_id:
            logger.debug("Converted %s to ObjectId", param_name)
            return validate_and_convert_object_id(param_value)
        return param_value

    # Handle string parameters
    if param_name in STRING_PARAMS and isinstance(param_value, str):
        logger.debug("Sanitized string parameter %s", param_name)
        return sanitize_string(param_value)

    # Handle lists and complex types
    if isinstance(param_value, list):
        return _sanitize_list_parameter(param_name, param_value)

    # Default: pass through without modification
    return param_value


def sanitize_inputs[T: Callable[..., Any]](func: T) -> T:
    """Sanitize inputs for GraphQL mutations automatically.

    This decorator inspects the function signature and applies appropriate
    sanitization based on parameter names and types.

    Args:
        func: The function to decorate

    Returns:
        The decorated function with automatic input sanitization

    """

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Get function signature
        sig = inspect.signature(func)

        # Create a mapping of parameter names to their values
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()

        # Sanitize each parameter
        sanitized_kwargs = {}

        for param_name, param_value in bound.arguments.items():
            # Skip 'self' parameter and None values
            if param_name == "self" or param_value is None:
                sanitized_kwargs[param_name] = param_value
                continue

            try:
                sanitized_kwargs[param_name] = _sanitize_parameter(param_name, param_value)
            except Exception:
                logger.exception("Sanitization failed for parameter %s", param_name)
                # Re-raise the exception to maintain error handling
                raise

        # Call the original function with sanitized parameters
        new_bound = sig.bind(**sanitized_kwargs)
        return await func(*new_bound.args, **new_bound.kwargs)

    return cast("T", wrapper)


def sanitize_graphql_mutation[T: Callable[..., Any]](func: T) -> T:
    """Sanitize inputs specifically for GraphQL mutations.

    This is an alias for sanitize_inputs with additional logging
    specifically for GraphQL mutations.

    Args:
        func: The GraphQL mutation function to decorate

    Returns:
        The decorated function with input sanitization

    """

    @sanitize_inputs
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        logger.info("Executing sanitized GraphQL mutation: %s", func.__name__)
        return await func(*args, **kwargs)

    return cast("T", wrapper)
