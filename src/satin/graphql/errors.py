"""GraphQL error types for Satin API."""

from typing import TypeVar

import strawberry

T = TypeVar("T")


@strawberry.type
class ValidationError:
    """Validation error for invalid input data."""

    field: str
    message: str

    @staticmethod
    def create(field: str, message: str) -> "ValidationError":
        """Create a validation error."""
        return ValidationError(field=field, message=message)


@strawberry.type
class NotFoundError:
    """Error when a requested resource is not found."""

    resource: str
    id: str
    message: str

    @staticmethod
    def create(resource: str, resource_id: str) -> "NotFoundError":
        """Create a not found error."""
        return NotFoundError(
            resource=resource,
            id=resource_id,
            message=f"{resource} with ID {resource_id} not found",
        )


@strawberry.type
class OperationError:
    """General operation error."""

    message: str
    details: str | None = None

    @staticmethod
    def create(message: str, details: str | None = None) -> "OperationError":
        """Create an operation error."""
        return OperationError(message=message, details=details)


# Success result types
@strawberry.type
class SuccessResult[T]:
    """Generic success result with data."""

    data: T
    success: bool = True
    message: str = "Operation completed successfully"


@strawberry.type
class DeleteResult:
    """Result of a delete operation."""

    deleted: bool
    message: str

    @staticmethod
    def success(resource: str) -> "DeleteResult":
        """Create a successful delete result."""
        return DeleteResult(deleted=True, message=f"{resource} deleted successfully")

    @staticmethod
    def not_found(resource: str) -> "DeleteResult":
        """Create a not found delete result."""
        return DeleteResult(deleted=False, message=f"{resource} not found")
