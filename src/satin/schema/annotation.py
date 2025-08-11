import strawberry

from satin.models.annotation import Annotation as AnnotationModel
from satin.models.annotation import BBox as BBoxModel


@strawberry.experimental.pydantic.type(model=AnnotationModel)
class Annotation:
    text: strawberry.auto
    tags: strawberry.auto


@strawberry.experimental.pydantic.input(model=AnnotationModel)
class AnnotationInput:
    text: strawberry.auto
    tags: strawberry.auto


@strawberry.experimental.pydantic.type(model=BBoxModel)
class BBox:
    x: strawberry.auto
    y: strawberry.auto
    width: strawberry.auto
    height: strawberry.auto
    annotation: strawberry.auto


@strawberry.experimental.pydantic.input(model=BBoxModel)
class BBoxInput:
    x: strawberry.auto
    y: strawberry.auto
    width: strawberry.auto
    height: strawberry.auto
    annotation: strawberry.auto
