import asyncio
from datetime import UTC, datetime
from enum import Enum
from typing import Any

import strawberry
from bson import ObjectId

from satin.db import db
from satin.schema.annotation import Annotation, BBox, BBoxInput
from satin.schema.image import Image, get_image
from satin.schema.project import Project, get_project


def _bbox_input_to_bbox(bbox_input: BBoxInput) -> BBox:
    """Convert BBoxInput to BBox."""
    annotation = Annotation(
        text=bbox_input.annotation.text,
        tags=bbox_input.annotation.tags,
    )
    return BBox(
        x=bbox_input.x,
        y=bbox_input.y,
        width=bbox_input.width,
        height=bbox_input.height,
        annotation=annotation,
    )


@strawberry.enum
class TaskStatus(Enum):
    DRAFT = "draft"
    FINISHED = "finished"
    REVIEWED = "reviewed"


@strawberry.type
class Task:
    id: strawberry.ID
    image: Image
    project: Project
    bboxes: list[BBox]
    status: TaskStatus = TaskStatus.DRAFT
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

        # Convert bbox dicts to BBox objects with proper Annotation objects
        bboxes = []
        for bbox_data in task_data.get("bboxes", []):
            annotation_data = bbox_data.get("annotation", {})
            annotation = Annotation(text=annotation_data.get("text"), tags=annotation_data.get("tags"))
            bbox = BBox(
                x=bbox_data["x"],
                y=bbox_data["y"],
                width=bbox_data["width"],
                height=bbox_data["height"],
                annotation=annotation,
            )
            bboxes.append(bbox)
        task_data["bboxes"] = bboxes

        # Convert status string to enum
        if "status" in task_data:
            task_data["status"] = TaskStatus(task_data["status"])

        return Task(**task_data)
    return None


async def get_all_tasks(limit: int | None = None, offset: int = 0) -> list[Task]:
    """Fetch paginated tasks and total count."""
    # Build query with pagination
    pipeline: list[dict[str, Any]] = [
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
    opt_cursor = db["tasks"].aggregate(pipeline)
    if asyncio.iscoroutine(opt_cursor):
        cursor = await opt_cursor
    else:
        cursor = opt_cursor  # Handle sync cursor for testing
    async for task_data in cursor:
        # Convert bbox dicts to BBox objects with proper Annotation objects
        bboxes = []
        for bbox_data in task_data.get("bboxes", []):
            annotation_data = bbox_data.get("annotation", {})
            annotation = Annotation(text=annotation_data.get("text"), tags=annotation_data.get("tags"))
            bbox = BBox(
                x=bbox_data["x"],
                y=bbox_data["y"],
                width=bbox_data["width"],
                height=bbox_data["height"],
                annotation=annotation,
            )
            bboxes.append(bbox)
        task_data["bboxes"] = bboxes

        # Convert joined image and project data to proper objects
        if "image" in task_data:
            image_data = task_data["image"]
            task_data["image"] = Image(id=str(image_data["_id"]), url=image_data["url"])  # type: ignore[arg-type]

        if "project" in task_data:
            project_data = task_data["project"]
            task_data["project"] = Project(
                id=str(project_data["_id"]),  # type: ignore[arg-type]
                name=project_data["name"],
                description=project_data["description"],
            )

        task_data.pop("_id", None)
        task_data.pop("image_id", None)
        task_data.pop("project_id", None)

        # Convert status string to enum
        if "status" in task_data:
            task_data["status"] = TaskStatus(task_data["status"])

        results.append(Task(**task_data))
    return results


async def create_task(
    image_id: strawberry.ID,
    project_id: strawberry.ID,
    bboxes: list[BBox | BBoxInput] | None = None,
    status: TaskStatus = TaskStatus.DRAFT,
) -> Task:
    """Create a new task in the database."""
    # Convert BBoxInput to BBox if needed
    converted_bboxes = []
    if bboxes is not None:
        for bbox in bboxes:
            if isinstance(bbox, BBoxInput):
                converted_bboxes.append(_bbox_input_to_bbox(bbox))
            else:
                converted_bboxes.append(bbox)

    task_data = {
        "image_id": ObjectId(image_id),
        "project_id": ObjectId(project_id),
        "bboxes": [strawberry.asdict(x) for x in converted_bboxes],
        "status": status.value,
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

    # Convert bboxes back to BBox objects
    task_data["bboxes"] = converted_bboxes

    # Convert status string to enum
    if "status" in task_data:
        task_data["status"] = TaskStatus(task_data["status"])

    return Task(**task_data)  # type: ignore[arg-type]


async def update_task(
    id: strawberry.ID,  # noqa: A002
    image_id: strawberry.ID | None = None,
    project_id: strawberry.ID | None = None,
    bboxes: list[BBox | BBoxInput] | None = None,
    status: TaskStatus | None = None,
) -> Task | None:
    """Update a task in the database."""
    update_data: dict[str, Any] = {}
    if image_id is not None:
        update_data["image_id"] = ObjectId(image_id)
    if project_id is not None:
        update_data["project_id"] = ObjectId(project_id)
    if bboxes is not None:
        # Convert BBoxInput to BBox if needed
        converted_bboxes = []
        for bbox in bboxes:
            if isinstance(bbox, BBoxInput):
                converted_bboxes.append(_bbox_input_to_bbox(bbox))
            else:
                converted_bboxes.append(bbox)
        update_data["bboxes"] = [strawberry.asdict(x) for x in converted_bboxes]
    if status is not None:
        update_data["status"] = status.value

    if update_data:
        await db["tasks"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    return await get_task(id)


async def delete_task(id: strawberry.ID) -> bool:  # noqa: A002
    """Delete a task from the database."""
    result = await db["tasks"].delete_one({"_id": ObjectId(id)})
    return result.deleted_count > 0
