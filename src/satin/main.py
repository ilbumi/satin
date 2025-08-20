import strawberry
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from satin.config import config
from satin.middleware.graphql_security import GraphQLSecurityExtension
from satin.middleware.logging import RequestLoggingMiddleware
from satin.middleware.rate_limit import RateLimitMiddleware
from satin.middleware.security import SecurityHeadersMiddleware
from satin.schema.mutation import Mutation
from satin.schema.query import Query

schema = strawberry.Schema(query=Query, mutation=Mutation, extensions=[GraphQLSecurityExtension()])


def create_app() -> FastAPI:
    """Create FastAPI application with GraphQL endpoint."""
    app = FastAPI(title="SATIn API", description="Simple Annotation Tool for Images")

    # Add security headers middleware first
    app.add_middleware(SecurityHeadersMiddleware)

    # Add rate limiting middleware
    app.add_middleware(RateLimitMiddleware)

    # Add request logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Configure CORS with specific origins from config
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,  # Use specific origins from config
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    graphql_app = GraphQLRouter(schema)
    app.include_router(graphql_app, prefix="/graphql")

    return app


app = create_app()


@app.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
