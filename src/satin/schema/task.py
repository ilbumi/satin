from datetime import datetime
from enum import Enum

import strawberry

from satin.schema.annotation import BBox
from satin.schema.image import Image
from satin.schema.project import Project


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
