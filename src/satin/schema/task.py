from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Literal

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


async def get_all_tasks() -> AsyncIterator[Task]:
    """Fetch all tasks from the database as async generator."""
    async for task_data in db["tasks"].find():
        task_data["id"] = str(task_data["_id"])
        del task_data["_id"]

        # Load related objects
        task_data["image"] = await get_image(task_data["image_id"])
        task_data["project"] = await get_project(task_data["project_id"])
        del task_data["image_id"]
        del task_data["project_id"]

        yield Task(**task_data)


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
        "bboxes": bboxes or [],
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

    return Task(**task_data)


async def update_task(
    id: strawberry.ID,  # noqa: A002
    image_id: strawberry.ID | None = None,
    project_id: strawberry.ID | None = None,
    bboxes: list[BBox] | None = None,
    status: Literal["draft", "finished", "reviewed"] | None = None,
) -> Task | None:
    """Update a task in the database."""
    update_data = {}
    if image_id is not None:
        update_data["image_id"] = ObjectId(image_id)
    if project_id is not None:
        update_data["project_id"] = ObjectId(project_id)
    if bboxes is not None:
        update_data["bboxes"] = bboxes
    if status is not None:
        update_data["status"] = status

    if update_data:
        await db["tasks"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    return await get_task(id)


async def delete_task(id: strawberry.ID) -> bool:  # noqa: A002
    """Delete a task from the database."""
    result = await db["tasks"].delete_one({"_id": ObjectId(id)})
    return result.deleted_count > 0
