"""Logging configuration for Satin using structlog."""

import asyncio
import logging
import sys
from collections.abc import Callable
from contextvars import ContextVar
from functools import wraps
from time import time
from typing import Any
from uuid import uuid4

import structlog

# Context variable for request tracking
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def setup_logging(level: str = "INFO", json_logs: bool = False) -> None:
    """Configure application logging with structlog.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to output logs as JSON (useful for production)

    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    # Configure Strawberry's execution logger
    logging.getLogger("strawberry.execution").setLevel(logging.INFO)

    # Processors for structlog
    processors: list[Any] = [
        structlog.contextvars.merge_contextvars,  # Merge context variables
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.CallsiteParameterAdder(
            parameters=[
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.LINENO,
                structlog.processors.CallsiteParameter.FUNC_NAME,
            ]
        ),
    ]

    # Add development or production processors
    if json_logs:
        processors.extend(
            [
                structlog.processors.dict_tracebacks,
                structlog.processors.JSONRenderer(),
            ]
        )
    else:
        processors.extend(
            [
                structlog.dev.ConsoleRenderer(
                    colors=True,
                    exception_formatter=structlog.dev.RichTracebackFormatter(
                        show_locals=True,
                        max_frames=2,
                    ),
                ),
            ]
        )

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.getLogger().level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def generate_request_id() -> str:
    """Generate a new request ID."""
    return str(uuid4())[:8]  # Use first 8 chars for brevity


def bind_request_id(request_id: str | None = None) -> None:
    """Bind request ID to context for all subsequent logs.

    Args:
        request_id: Request ID to bind, generates one if not provided

    """
    rid = request_id or generate_request_id()
    request_id_var.set(rid)
    structlog.contextvars.bind_contextvars(request_id=rid)


def clear_request_context() -> None:
    """Clear request context variables."""
    structlog.contextvars.clear_contextvars()


def with_request_context(func: Callable[..., Any]) -> Callable[..., Any]:
    """Create a decorator to automatically set request context for a function."""

    @wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        request_id = generate_request_id()
        bind_request_id(request_id)
        try:
            return await func(*args, **kwargs)
        finally:
            clear_request_context()

    @wraps(func)
    def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
        request_id = generate_request_id()
        bind_request_id(request_id)
        try:
            return func(*args, **kwargs)
        finally:
            clear_request_context()

    # Return appropriate wrapper based on function type
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper


def log_performance(  # noqa: C901
    logger: structlog.BoundLogger | None = None, slow_threshold_ms: float = 100
) -> Callable[[Any], Any]:
    """Create a decorator to log function performance with structured logging.

    Args:
        logger: Logger to use, creates one if not provided
        slow_threshold_ms: Threshold in milliseconds to log as warning

    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:  # noqa: C901
        nonlocal logger
        if logger is None:
            logger = structlog.get_logger(func.__module__)

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time()
            log = logger.bind(function=func.__name__)

            try:
                log.debug("function_started")
                result = await func(*args, **kwargs)
                duration_ms = (time() - start) * 1000

                if duration_ms > slow_threshold_ms:
                    log.warning(
                        "slow_function_completed",
                        duration_ms=duration_ms,
                    )
                else:
                    log.debug(
                        "function_completed",
                        duration_ms=duration_ms,
                    )

            except Exception as e:
                duration_ms = (time() - start) * 1000
                log.exception(
                    "function_failed",
                    duration_ms=duration_ms,
                    error=str(e),
                )
                raise
            else:
                return result

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time()
            log = logger.bind(function=func.__name__)

            try:
                log.debug("function_started")
                result = func(*args, **kwargs)
                duration_ms = (time() - start) * 1000

                if duration_ms > slow_threshold_ms:
                    log.warning(
                        "slow_function_completed",
                        duration_ms=duration_ms,
                    )
                else:
                    log.debug(
                        "function_completed",
                        duration_ms=duration_ms,
                    )
            except Exception as e:
                duration_ms = (time() - start) * 1000
                log.exception(
                    "function_failed",
                    duration_ms=duration_ms,
                    error=str(e),
                )
                raise
            else:
                return result

        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# Repository logging mixin
class LoggingMixin:
    """Mixin to add structured logging to repositories."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize with logger."""
        super().__init__(*args, **kwargs)
        self.logger = structlog.get_logger(self.__class__.__module__)

    def _log_operation(self, operation: str, **kwargs: Any) -> Any:
        """Create a logger bound with operation context.

        Args:
            operation: Name of the operation
            **kwargs: Additional context to bind

        Returns:
            Bound logger with context

        """
        return self.logger.bind(
            repository=self.__class__.__name__,
            operation=operation,
            **kwargs,
        )
