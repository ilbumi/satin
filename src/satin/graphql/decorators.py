"""Decorators for GraphQL resolvers to handle errors cleanly."""

from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

import structlog
from pydantic import ValidationError as PydanticValidationError

from .errors import NotFoundError, OperationError, SuccessResult, ValidationError

T = TypeVar("T")
logger = structlog.get_logger(__name__)


def handle_mutation_errors(resource_name: str = "Resource") -> Callable[[Any], Any]:
    """Handle errors in GraphQL mutations.

    Automatically wraps the result in SuccessResult and catches exceptions
    to return appropriate error types.

    Args:
        resource_name: Name of the resource being operated on for error messages

    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            error_result: ValidationError | OperationError | None = None

            try:
                # Execute the mutation
                result = await func(*args, **kwargs)

            except PydanticValidationError as e:
                # Handle Pydantic validation errors
                # Extract the first error for simplicity
                first_error = (
                    e.errors()[0]
                    if e.errors()
                    else {"loc": ("unknown",), "msg": "Validation error", "type": "unknown", "input": "unknown"}
                )
                field = ".".join(str(loc) for loc in first_error["loc"]) or "input"
                message = first_error["msg"]

                logger.warning(
                    "Validation error in %s",
                    func.__name__,
                    field=field,
                    error=message,
                )
                error_result = ValidationError.create(field, message)

            except ValueError as e:
                # Handle other validation errors (e.g., invalid ObjectId)
                logger.warning("Validation error in %s", func.__name__, error=str(e))
                error_result = ValidationError.create("input", str(e))

            except Exception as e:
                # Handle unexpected errors
                logger.exception(
                    "Unexpected error in %s",
                    func.__name__,
                    error=str(e),
                )
                error_result = OperationError.create(
                    f"Failed to process {resource_name.lower()}",
                    "An unexpected error occurred. Please try again.",
                )

            if error_result is not None:
                return error_result

            # Process successful result
            # Wrap in SuccessResult for union type returns
            if result is None:
                # Handle None results (e.g., not found)
                return NotFoundError.create(resource_name, "unknown")
            return SuccessResult(data=result)

        # Return async wrapper (mutations are typically async)
        return async_wrapper

    return decorator


def handle_query_errors(default_value: Any = None) -> Callable[[Any], Any]:
    """Handle errors in GraphQL queries.

    Returns None or default value on errors instead of raising exceptions.

    Args:
        default_value: Value to return on error (None by default)

    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await func(*args, **kwargs)
            except PydanticValidationError as e:
                # Log validation errors but return default
                logger.warning(
                    "Validation error in query %s",
                    func.__name__,
                    error=str(e),
                )
                return default_value
            except Exception as e:
                # Log unexpected errors but return default
                logger.exception(
                    "Error in query %s",
                    func.__name__,
                    error=str(e),
                )
                return default_value

        # Return async wrapper
        return async_wrapper

    return decorator
