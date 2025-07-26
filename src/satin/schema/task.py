from datetime import datetime
from typing import Literal

import strawberry

from satin.schema.annotation import BBox
from satin.schema.image import Image
from satin.schema.project import Project


@strawberry.type
class Task:
    id: strawberry.ID
    image: Image
    project: Project
    bboxes: list[BBox]
    status: Literal["draft", "finished", "reviewed"] = "draft"
    created_at: datetime
