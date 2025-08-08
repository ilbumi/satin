import strawberry

from satin.models.project import Project as ProjectModel


@strawberry.experimental.pydantic.type(model=ProjectModel)
class Project:
    id: strawberry.auto
    name: strawberry.auto
    description: strawberry.auto
