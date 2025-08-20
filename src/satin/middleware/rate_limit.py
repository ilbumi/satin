"""Rate limiting middleware for FastAPI and GraphQL endpoints."""

import json
import logging
import time
from collections import defaultdict
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


# In-memory store for rate limiting (in production, use Redis)
class InMemoryRateLimitStore:
    """Simple in-memory store for rate limiting."""

    def __init__(self):
        """Initialize the in-memory rate limit store."""
        self._store: dict[str, dict[str, tuple[int, float]]] = defaultdict(dict)

    def get(self, key: str) -> int:
        """Get current count for a key."""
        now = time.time()
        if key in self._store:
            for window_key, (_count, timestamp) in list(self._store[key].items()):
                # Clean up expired windows
                window_duration = int(window_key.split(":")[1])
                if now - timestamp > window_duration:
                    del self._store[key][window_key]

            if self._store[key]:
                return sum(count for count, _ in self._store[key].values())
        return 0

    def incr(self, key: str, window: int = 60, amount: int = 1) -> int:
        """Increment counter for a key within a time window."""
        now = time.time()
        window_key = f"{int(now // window) * window}:{window}"

        if window_key not in self._store[key]:
            self._store[key][window_key] = (0, now)

        count, timestamp = self._store[key][window_key]
        self._store[key][window_key] = (count + amount, timestamp)

        result = self.get(key)
        return result if result is not None else 0

    def reset(self, key: str) -> None:
        """Reset counter for a key."""
        if key in self._store:
            del self._store[key]


# Global rate limit store
rate_limit_store = InMemoryRateLimitStore()


def _is_rate_limiting_disabled() -> bool:
    """Check if rate limiting is disabled.

    Returns:
        True if rate limiting should be disabled

    """
    try:
        from satin.config import config  # noqa: PLC0415
    except ImportError:
        return False
    else:
        return config.disable_rate_limiting


def get_client_identifier(request: Request) -> str:
    """Get a unique identifier for the client (IP address or user ID)."""
    # Fall back to IP address
    return f"ip:{get_remote_address(request)}"


def is_graphql_request(request: Request) -> bool:
    """Check if the request is a GraphQL request."""
    return bool(request.url.path.startswith("/graphql"))


def get_query_complexity_score(query: str) -> int:
    """Estimate GraphQL query complexity for rate limiting."""
    if not query:
        return 1

    # Simple heuristic based on query structure
    complexity = 1

    # Count nested levels
    open_braces = query.count("{")
    complexity += open_braces * 2

    # Count field selections
    complexity += query.count("\n") // 2

    # Higher cost for mutations
    if "mutation" in query.lower():
        complexity += 5

    # Higher cost for subscriptions
    if "subscription" in query.lower():
        complexity += 10

    return min(complexity, 100)  # Cap at 100


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Custom rate limiting middleware with GraphQL-aware features."""

    def __init__(
        self,
        app: ASGIApp,
        default_limit: int = 10000,  # requests per minute
        graphql_limit: int = 1000,  # GraphQL requests per minute
        burst_limit: int = 1000,  # requests per 10 seconds
        complexity_limit: int = 10000,  # complexity points per minute
    ):
        """Initialize rate limiting middleware.

        Args:
            app: ASGI application
            default_limit: Default requests per minute
            graphql_limit: GraphQL requests per minute
            burst_limit: Requests per 10 seconds (burst protection)
            complexity_limit: Complexity points per minute for GraphQL

        """
        super().__init__(app)
        self.default_limit = default_limit
        self.graphql_limit = graphql_limit
        self.burst_limit = burst_limit
        self.complexity_limit = complexity_limit

    async def _handle_default_rate_limit(self, _request: Request, client_id: str) -> None:
        """Handle rate limiting for non-GraphQL requests."""
        limit_key = f"{client_id}:default"
        count = rate_limit_store.incr(limit_key, window=60)

        if count > self.default_limit:
            msg = f"Default rate limit exceeded: {count}/{self.default_limit} per minute"
            raise ValueError(msg)

    async def _handle_graphql_rate_limit(self, request: Request, client_id: str) -> None:
        """Handle rate limiting for GraphQL requests with complexity awareness."""
        # Basic GraphQL request count
        graphql_key = f"{client_id}:graphql"
        graphql_count = rate_limit_store.incr(graphql_key, window=60)

        if graphql_count > self.graphql_limit:
            msg = f"GraphQL rate limit exceeded: {graphql_count}/{self.graphql_limit} per minute"
            raise ValueError(msg)

        # Complexity-based rate limiting
        try:
            body = await request.body()
            if body:
                data = json.loads(body)
                query = data.get("query", "")

                if query:
                    complexity = get_query_complexity_score(query)
                    complexity_key = f"{client_id}:complexity"
                    total_complexity = rate_limit_store.incr(complexity_key, window=60, amount=complexity)

                    if total_complexity > self.complexity_limit:
                        msg = (
                            f"GraphQL complexity limit exceeded: {total_complexity}/{self.complexity_limit} "
                            "points per minute"
                        )
                        raise ValueError(msg)

                    logger.debug(
                        "GraphQL query complexity for %s: %d (total: %d)", client_id, complexity, total_complexity
                    )

        except (json.JSONDecodeError, KeyError):
            # If we can't parse the request, apply default limits
            logger.debug("Could not parse GraphQL request for complexity analysis")

    def _create_rate_limit_response(self, message: str) -> Response:
        """Create a rate limit exceeded response."""
        return Response(
            content=f'{{"error": "Rate limit exceeded", "message": "{message}"}}',
            status_code=429,
            headers={"Content-Type": "application/json", "Retry-After": "60", "X-RateLimit-Exceeded": "true"},
        )

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """Apply rate limiting to requests."""
        # Skip rate limiting if disabled (e.g., during testing)
        if _is_rate_limiting_disabled():
            return await call_next(request)

        client_id = get_client_identifier(request)

        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        try:
            # Apply burst protection (short-term limit)
            burst_key = f"{client_id}:burst"
            burst_count = rate_limit_store.incr(burst_key, window=10)
            if burst_count > self.burst_limit:
                logger.warning("Burst rate limit exceeded for %s: %d/%d", client_id, burst_count, self.burst_limit)
                msg = f"Too many requests in short timeframe: {burst_count}/{self.burst_limit} per 10 seconds"
                return self._create_rate_limit_response(msg)

            # Apply different limits based on request type
            if is_graphql_request(request):
                await self._handle_graphql_rate_limit(request, client_id)
            else:
                await self._handle_default_rate_limit(request, client_id)

            # Process the request
            return await call_next(request)

        except ValueError as e:
            logger.warning("Rate limit exceeded for %s: %s", client_id, e)
            return self._create_rate_limit_response(str(e))
        except Exception:
            logger.exception("Rate limiting error for %s", client_id)
            # Don't block requests on rate limiting errors
            return await call_next(request)


def create_limiter() -> Limiter:
    """Create a slowapi limiter instance."""
    return Limiter(key_func=get_remote_address)


limiter = create_limiter()
