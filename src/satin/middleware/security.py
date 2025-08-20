"""Security middleware for FastAPI application."""

import secrets
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from satin.config import config


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    def __init__(self, app: ASGIApp, nonce_enabled: bool = False) -> None:
        """Initialize the security middleware.

        Args:
            app: The ASGI application
            nonce_enabled: Whether to generate nonces for CSP

        """
        super().__init__(app)
        self.nonce_enabled = nonce_enabled

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """Add security headers to the response."""
        # Generate a nonce for this request if enabled
        nonce = secrets.token_urlsafe(16) if self.nonce_enabled else None

        # Store nonce in request state for template usage
        if nonce:
            request.state.csp_nonce = nonce

        response = await call_next(request)

        # Skip security headers for health checks and static files
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return response

        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self'" + (f" 'nonce-{nonce}'" if nonce else " 'unsafe-inline'"),
            "style-src 'self' 'unsafe-inline'",  # Allow inline styles for API docs
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            f"connect-src 'self' {' '.join(config.cors_origins)}",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
        ]

        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Additional security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # HSTS header (only for HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Additional hardening headers
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

        return response
