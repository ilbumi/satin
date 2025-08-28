"""Strawberry GraphQL extensions for logging and monitoring."""

from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Any, Literal

import structlog
from strawberry.extensions import SchemaExtension

from satin.logging import bind_request_id, clear_request_context, generate_request_id

if TYPE_CHECKING:
    from strawberry.types.graphql import OperationType


class RequestLoggingExtension(SchemaExtension):
    """Extension to add request tracking and logging to GraphQL operations."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the extension."""
        super().__init__(*args, **kwargs)
        self.logger = structlog.get_logger(__name__)

    async def on_operation(self) -> AsyncIterator[None]:
        """Track and log GraphQL operations."""
        # Generate and bind request ID
        request_id = generate_request_id()
        bind_request_id(request_id)

        # Get operation details
        execution_context = self.execution_context
        operation_name = execution_context.operation_name or "unnamed"

        # Safely get operation type
        try:
            operation_type: OperationType | Literal["unknown"] = execution_context.operation_type
        except RuntimeError:
            # No document available yet
            operation_type = "unknown"

        # Log operation start
        self.logger.info(
            "graphql_operation_started",
            operation_name=operation_name,
            operation_type=operation_type,
            request_id=request_id,
        )

        try:
            # Execute the operation
            yield

            # Log successful completion
            self.logger.info(
                "graphql_operation_completed",
                operation_name=operation_name,
                operation_type=operation_type,
                request_id=request_id,
            )
        except Exception as e:
            # Log operation error
            self.logger.exception(
                "graphql_operation_failed",
                operation_name=operation_name,
                operation_type=operation_type,
                request_id=request_id,
                error=str(e),
            )
            raise
        finally:
            # Clear request context
            clear_request_context()
