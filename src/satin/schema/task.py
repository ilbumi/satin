from datetime import UTC, datetime
from typing import Any, Literal

import strawberry
from bson import ObjectId

from satin.db import db
from satin.schema.annotation import BBox
from satin.schema.image import Image, get_image
from satin.schema.project import Project, get_project


@strawberry.type
class Task:
    id: strawberry.ID
    image: Image
    project: Project
    bboxes: list[BBox]
    status: Literal["draft", "finished", "reviewed"] = "draft"
    created_at: datetime


async def get_task(id: strawberry.ID) -> Task | None:  # noqa: A002
    """Fetch a task by its ID from the database."""
    task_data = await db["tasks"].find_one({"_id": ObjectId(id)})
    if task_data:
        task_data["id"] = str(task_data["_id"])
        del task_data["_id"]

        # Load related objects
        task_data["image"] = await get_image(task_data["image_id"])
        task_data["project"] = await get_project(task_data["project_id"])
        del task_data["image_id"]
        del task_data["project_id"]

        return Task(**task_data)
    return None


async def get_all_tasks(limit: int | None = None, offset: int = 0) -> list[Task]:
    """Fetch paginated tasks and total count."""
    # Build query with pagination
    pipeline = [
        {"$skip": offset},
        {"$limit": limit if limit is not None else 1000},
        {
            "$lookup": {
                "from": "images",
                "localField": "image_id",
                "foreignField": "_id",
                "as": "image",
            }
        },
        {"$unwind": "$image"},
        {
            "$lookup": {
                "from": "projects",
                "localField": "project_id",
                "foreignField": "_id",
                "as": "project",
            }
        },
        {"$unwind": "$project"},
        {
            "$addFields": {
                "id": {"$toString": "$_id"},
                "image.id": {"$toString": "$image._id"},
                "project.id": {"$toString": "$project._id"},
            }
        },
    ]

    results: list[Task] = []
    async for task_data in db["tasks"].aggregate(pipeline):
        task_data["bboxes"] = [BBox(**bbox) for bbox in task_data.get("bboxes", [])]
        task_data.pop("_id", None)
        task_data.pop("image_id", None)
        task_data.pop("project_id", None)

        results.append(Task(**task_data))
    return results


async def create_task(
    image_id: strawberry.ID,
    project_id: strawberry.ID,
    bboxes: list[BBox] | None = None,
    status: Literal["draft", "finished", "reviewed"] = "draft",
) -> Task:
    """Create a new task in the database."""
    task_data = {
        "image_id": ObjectId(image_id),
        "project_id": ObjectId(project_id),
        "bboxes": [strawberry.asdict(x) for x in bboxes] if bboxes is not None else [],
        "status": status,
        "created_at": datetime.now(tz=UTC),
    }
    result = await db["tasks"].insert_one(task_data)
    task_data["id"] = str(result.inserted_id)
    del task_data["_id"]

    # Load related objects
    task_data["image"] = await get_image(image_id)
    task_data["project"] = await get_project(project_id)
    del task_data["image_id"]
    del task_data["project_id"]
    task_data.pop("_id", None)

    return Task(**task_data)  # type: ignore[arg-type]


async def update_task(
    id: strawberry.ID,  # noqa: A002
    image_id: strawberry.ID | None = None,
    project_id: strawberry.ID | None = None,
    bboxes: list[BBox] | None = None,
    status: Literal["draft", "finished", "reviewed"] | None = None,
) -> Task | None:
    """Update a task in the database."""
    update_data: dict[str, Any] = {}
    if image_id is not None:
        update_data["image_id"] = ObjectId(image_id)
    if project_id is not None:
        update_data["project_id"] = ObjectId(project_id)
    if bboxes is not None:
        update_data["bboxes"] = [strawberry.asdict(x) for x in bboxes]
    if status is not None:
        update_data["status"] = status

    if update_data:
        await db["tasks"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    return await get_task(id)


async def delete_task(id: strawberry.ID) -> bool:  # noqa: A002
    """Delete a task from the database."""
    result = await db["tasks"].delete_one({"_id": ObjectId(id)})
    return result.deleted_count > 0
