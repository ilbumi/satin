import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log requests and responses with timing information."""

    async def dispatch(self, request: Request, call_next):
        """Process the request and log timing information."""
        start_time = time.time()

        # Log request
        logger.info("Request: %s %s", request.method, request.url)

        response = await call_next(request)

        # Log response with timing
        process_time = time.time() - start_time
        logger.info("Response: %d - %.4fs", response.status_code, process_time)

        if process_time > 1.0:  # Log slow requests
            logger.warning("Slow request: %s %s took %.4fs", request.method, request.url, process_time)

        return response
