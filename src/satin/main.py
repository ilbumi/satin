import strawberry
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from satin.config import config
from satin.middleware.logging import RequestLoggingMiddleware
from satin.schema.mutation import Mutation
from satin.schema.query import Query

schema = strawberry.Schema(query=Query, mutation=Mutation)


def create_app() -> FastAPI:
    """Create FastAPI application with GraphQL endpoint."""
    app = FastAPI(title="SATIn API", description="Simple Annotation Tool for Images")

    # Add request logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    graphql_app = GraphQLRouter(schema)
    app.include_router(graphql_app, prefix="/graphql")

    return app


app = create_app()


@app.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
