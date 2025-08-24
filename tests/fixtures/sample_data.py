"""Test data builders and sample data."""

from bson import ObjectId

from satin.models.annotation import AnnotationCreate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageStatus
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.models.tag import TagCreate


def create_test_image(
    url: str = "http://test.com/image.jpg", status: ImageStatus = ImageStatus.NEW, **kwargs
) -> ImageCreate:
    """Create test image data."""
    data = {"url": url, "status": status}
    data.update(kwargs)
    return ImageCreate(**data)


def create_test_annotation(image_id: PyObjectId | None = None, **kwargs) -> AnnotationCreate:
    """Create test annotation data."""
    if image_id is None:
        image_id = PyObjectId(ObjectId())

    bbox = BoundingBox(x=10, y=20, width=100, height=50)
    data = {"image_id": image_id, "bounding_box": bbox, "class_name": "test_object", **kwargs}
    return AnnotationCreate(**data)


def create_test_ml_job(
    image_url: str = "https://test.com/image.jpg",
    endpoint: str = "ml-service",
    status: MLJobStatus = MLJobStatus.PENDING,
    **kwargs,
) -> MLJobCreate:
    """Create test ML job data."""
    data = {"image_url": image_url, "endpoint": endpoint, "status": status, **kwargs}
    return MLJobCreate(**data)


def create_test_tag(name: str = "test_tag", **kwargs) -> TagCreate:
    """Create test tag data."""
    data = {"name": name, **kwargs}
    return TagCreate(**data)


def create_multiple_images(count: int = 3) -> list[ImageCreate]:
    """Create multiple test images."""
    return [create_test_image(url=f"http://test{i}.com/image.jpg") for i in range(count)]


def create_multiple_annotations(image_id: PyObjectId, count: int = 3) -> list[AnnotationCreate]:
    """Create multiple test annotations for an image."""
    return [
        create_test_annotation(
            image_id=image_id,
            class_name=f"object_{i}",
            bounding_box=BoundingBox(x=i * 10, y=i * 20, width=100, height=50),
        )
        for i in range(count)
    ]


# Common GraphQL query strings
GRAPHQL_QUERIES = {
    "list_images": """
        query {
            images {
                id
                url
                status
                width
                height
                ext
                createdAt
                updatedAt
            }
        }
    """,
    "get_image": """
        query GetImage($id: String!) {
            image(id: $id) {
                id
                url
                status
            }
        }
    """,
    "create_image": """
        mutation CreateImage($input: ImageCreateInput!) {
            createImage(input: $input) {
                id
                url
                status
            }
        }
    """,
    "update_image": """
        mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
            updateImage(id: $id, input: $input) {
                id
                url
                status
            }
        }
    """,
    "delete_image": """
        mutation DeleteImage($id: String!) {
            deleteImage(id: $id)
        }
    """,
    "introspection_schema": """
        query {
            __schema {
                types {
                    name
                }
            }
        }
    """,
    "introspection_image_type": """
        query {
            __type(name: "Image") {
                fields {
                    name
                    type {
                        name
                    }
                }
            }
        }
    """,
}
