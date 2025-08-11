import strawberry

from satin.models.task import Task as TaskModel
from satin.models.task import TaskStatus as TaskStatusModel
from satin.schema.annotation import BBox
from satin.schema.image import Image
from satin.schema.project import Project

TaskStatus = strawberry.enum(TaskStatusModel)


@strawberry.experimental.pydantic.type(model=TaskModel)
class Task:
    id: strawberry.auto
    image: Image
    project: Project
    bboxes: list[BBox]
    status: strawberry.auto
    created_at: strawberry.auto
