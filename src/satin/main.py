import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

from satin.schema.mutation import Mutation
from satin.schema.query import Query

schema = strawberry.Schema(query=Query, mutation=Mutation)


def create_app() -> FastAPI:
    """Create FastAPI application with GraphQL endpoint."""
    app = FastAPI(title="SATIn API", description="Simple Annotation Tool for Images")

    graphql_app = GraphQLRouter(schema, path="/graphql")
    app.include_router(graphql_app, prefix="/graphql")

    return app


app = create_app()
