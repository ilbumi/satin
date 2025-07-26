import strawberry
from bson import ObjectId

from satin.db import db


@strawberry.type
class Project:
    id: strawberry.ID
    name: str
    description: str

    def __str__(self):
        """Get string representation of the Project."""
        return f"Project(id={self.id}, name={self.name}, description={self.description})"


async def get_project(id: strawberry.ID) -> Project:  # noqa: A002
    """Fetch a project by its ID from the database."""
    project_data = await db["projects"].find_one({"_id": ObjectId(id)})
    if project_data:
        return Project(**project_data)
    return None
