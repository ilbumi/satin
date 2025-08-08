import strawberry

from satin.models.image import Image as ImageModel


@strawberry.experimental.pydantic.type(model=ImageModel)
class Image:
    id: strawberry.auto
    url: strawberry.auto
