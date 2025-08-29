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


@strawberry.type
class RateLimitError:
    """Rate limit exceeded error."""

    retry_after_seconds: int
    message: str = "Rate limit exceeded"

    @staticmethod
    def create(retry_after: int = 60) -> "RateLimitError":
        """Create a rate limit error."""
        return RateLimitError(retry_after_seconds=retry_after)


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


# Batch operation types
@strawberry.type
class BatchOperationResult:
    """Result of a batch operation with partial success support."""

    total_count: int
    success_count: int
    failed_count: int
    message: str

    @property
    def all_succeeded(self) -> bool:
        """Check if all operations succeeded."""
        return self.success_count == self.total_count

    @staticmethod
    def create(total: int, success: int) -> "BatchOperationResult":
        """Create a batch operation result."""
        failed = total - success
        if success == total:
            message = f"All {total} operations completed successfully"
        elif success == 0:
            message = f"All {total} operations failed"
        else:
            message = f"{success} of {total} operations succeeded, {failed} failed"

        return BatchOperationResult(
            total_count=total,
            success_count=success,
            failed_count=failed,
            message=message,
        )
