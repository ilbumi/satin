import strawberry

from satin.schema.annotation import Project


@strawberry.type
class Query:
    """Root query type for the GraphQL schema."""

    @strawberry.field
    async def project(self, id: strawberry.ID) -> Project:  # noqa: A002
        """Fetch a project by its ID."""
        return await Project.get(id)
