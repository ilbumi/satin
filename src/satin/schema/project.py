from collections.abc import AsyncIterator

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


async def get_project(id: strawberry.ID) -> Project | None:  # noqa: A002
    """Fetch a project by its ID from the database."""
    project_data = await db["projects"].find_one({"_id": ObjectId(id)})
    if project_data:
        project_data["id"] = str(project_data["_id"])
        del project_data["_id"]
        return Project(**project_data)
    return None


async def get_all_projects() -> AsyncIterator[Project]:
    """Fetch all projects from the database as async generator."""
    async for project_data in db["projects"].find():
        project_data["id"] = str(project_data["_id"])
        del project_data["_id"]
        yield Project(**project_data)


async def create_project(name: str, description: str) -> Project:
    """Create a new project in the database."""
    project_data = {"name": name, "description": description}
    result = await db["projects"].insert_one(project_data)
    project_data["id"] = str(result.inserted_id)
    project_data.pop("_id", None)
    return Project(**project_data)  # type: ignore[arg-type]


async def update_project(id: strawberry.ID, name: str | None = None, description: str | None = None) -> Project | None:  # noqa: A002
    """Update a project in the database."""
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description

    if update_data:
        await db["projects"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    return await get_project(id)


async def delete_project(id: strawberry.ID) -> bool:  # noqa: A002
    """Delete a project from the database."""
    result = await db["projects"].delete_one({"_id": ObjectId(id)})
    return result.deleted_count > 0
