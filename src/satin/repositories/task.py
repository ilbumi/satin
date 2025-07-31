import asyncio
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

import strawberry
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from satin.schema.annotation import Annotation, BBox, BBoxInput
from satin.schema.image import Image
from satin.schema.project import Project
from satin.schema.task import Task, TaskStatus

from .base import BaseRepository
from .image import ImageRepository
from .project import ProjectRepository


def bbox_input_to_bbox(bbox_input: BBoxInput) -> BBox:
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


class TaskRepository(BaseRepository[Task]):
    """Repository for Task domain objects."""

    def __init__(self, db: AsyncDatabase):
        """Initialize the TaskRepository with a database connection."""
        super().__init__(db, "tasks")

    async def to_domain_object(self, data: dict[str, Any]) -> Task:
        """Convert database document to Task domain object."""
        data = self._convert_id(data)

        # Convert bbox dicts to BBox objects with proper Annotation objects
        bboxes = []
        for bbox_data in data.get("bboxes", []):
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
        data["bboxes"] = bboxes

        # Convert status string to enum
        if "status" in data:
            data["status"] = TaskStatus(data["status"])

        return Task(**data)

    async def get_task(self, task_id: strawberry.ID) -> Task | None:
        """Fetch a task by its ID from the database."""
        task_data = await self.find_by_id(task_id)
        if task_data:
            task_data["id"] = str(task_data["_id"])
            del task_data["_id"]

            # Load related objects

            image_repo = ImageRepository(self.db)
            project_repo = ProjectRepository(self.db)
            task_data["image"] = await image_repo.get_image(task_data["image_id"])
            task_data["project"] = await project_repo.get_project(task_data["project_id"])
            del task_data["image_id"]
            del task_data["project_id"]

            return await self.to_domain_object(task_data)
        return None

    async def get_all_tasks(self, limit: int | None = None, offset: int = 0) -> list[Task]:
        """Fetch paginated tasks and total count."""
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
        opt_cursor = self.collection.aggregate(pipeline)
        if asyncio.iscoroutine(opt_cursor):
            cursor = await opt_cursor
        else:
            cursor = opt_cursor  # Handle sync cursor for testing

        async for task_data in cursor:
            # Convert joined image and project data to proper objects
            if "image" in task_data:
                image_data = task_data["image"]
                task_data["image"] = Image(id=strawberry.ID(str(image_data["_id"])), url=image_data["url"])

            if "project" in task_data:
                project_data = task_data["project"]
                task_data["project"] = Project(
                    id=strawberry.ID(str(project_data["_id"])),
                    name=project_data["name"],
                    description=project_data["description"],
                )

            task_data.pop("_id", None)
            task_data.pop("image_id", None)
            task_data.pop("project_id", None)

            results.append(await self.to_domain_object(task_data))

        return results

    async def create_task(
        self,
        image_id: strawberry.ID,
        project_id: strawberry.ID,
        bboxes: Sequence[BBox | BBoxInput] | None = None,
        status: TaskStatus = TaskStatus.DRAFT,
    ) -> Task:
        """Create a new task in the database."""
        # Convert BBoxInput to BBox if needed
        converted_bboxes = []
        if bboxes is not None:
            for bbox in bboxes:
                if isinstance(bbox, BBoxInput):
                    converted_bboxes.append(bbox_input_to_bbox(bbox))
                else:
                    converted_bboxes.append(bbox)

        task_data = {
            "image_id": ObjectId(image_id),
            "project_id": ObjectId(project_id),
            "bboxes": [strawberry.asdict(x) for x in converted_bboxes],
            "status": status.value,
            "created_at": datetime.now(tz=UTC),
        }
        created_data = await self.create(task_data)

        # Load related objects

        image_repo = ImageRepository(self.db)
        project_repo = ProjectRepository(self.db)
        created_data["image"] = await image_repo.get_image(image_id)
        created_data["project"] = await project_repo.get_project(project_id)
        del created_data["image_id"]
        del created_data["project_id"]

        # Convert bboxes back to BBox objects
        created_data["bboxes"] = converted_bboxes

        # Convert status string to enum
        if "status" in created_data:
            created_data["status"] = TaskStatus(created_data["status"])

        return Task(**created_data)

    async def update_task(
        self,
        task_id: strawberry.ID,
        image_id: strawberry.ID | None = None,
        project_id: strawberry.ID | None = None,
        bboxes: Sequence[BBox | BBoxInput] | None = None,
        status: TaskStatus | None = None,
    ) -> bool:
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
                    converted_bboxes.append(bbox_input_to_bbox(bbox))
                else:
                    converted_bboxes.append(bbox)
            update_data["bboxes"] = [strawberry.asdict(x) for x in converted_bboxes]
        if status is not None:
            update_data["status"] = status.value

        return await self.update_by_id(task_id, update_data)

    async def delete_task(self, task_id: strawberry.ID) -> bool:
        """Delete a task from the database."""
        return await self.delete_by_id(task_id)

    async def get_task_by_image_and_project(self, image_id: strawberry.ID, project_id: strawberry.ID) -> Task | None:
        """Find a task for a specific image and project combination."""
        task_data = await self.collection.find_one({"image_id": ObjectId(image_id), "project_id": ObjectId(project_id)})

        if task_data:
            task_data["id"] = str(task_data["_id"])
            del task_data["_id"]

            # Load related objects

            image_repo = ImageRepository(self.db)
            project_repo = ProjectRepository(self.db)
            task_data["image"] = await image_repo.get_image(image_id)
            task_data["project"] = await project_repo.get_project(project_id)
            del task_data["image_id"]
            del task_data["project_id"]

            return await self.to_domain_object(task_data)
        return None
