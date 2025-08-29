"""Test data builders and sample data."""

from bson import ObjectId

from satin.models.annotation import AnnotationCreate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageStatus
from satin.models.ml_job import MLJobCreate, MLJobStatus


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
    data = {"image_id": image_id, "bounding_box": bbox, "tags": [], "description": "test_object", **kwargs}
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


def create_multiple_images(count: int = 3) -> list[ImageCreate]:
    """Create multiple test images."""
    return [create_test_image(url=f"http://test{i}.com/image.jpg") for i in range(count)]


def create_multiple_annotations(image_id: PyObjectId, count: int = 3) -> list[AnnotationCreate]:
    """Create multiple test annotations for an image."""
    return [
        create_test_annotation(
            image_id=image_id,
            description=f"object_{i}",
            bounding_box=BoundingBox(x=i * 10, y=i * 20, width=100, height=50),
        )
        for i in range(count)
    ]


# Common GraphQL query strings
GRAPHQL_QUERIES = {
    "list_images": """
        query {
            images {
                items {
                    id
                    url
                    status
                    width
                    height
                    ext
                    createdAt
                    updatedAt
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
                totalCount
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
                ... on ImageSuccessResult {
                    data {
                        id
                        url
                        status
                    }
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "update_image": """
        mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
            updateImage(id: $id, input: $input) {
                ... on ImageSuccessResult {
                    data {
                        id
                        url
                        status
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "delete_image": """
        mutation DeleteImage($id: String!) {
            deleteImage(id: $id) {
                deleted
                message
            }
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
    # Annotation queries
    "list_annotations": """
        query {
            annotations {
                items {
                    id
                    imageId
                    boundingBox {
                        x
                        y
                        width
                        height
                    }
                    tags
                    description
                    confidence
                    source
                    createdAt
                    updatedAt
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
                totalCount
            }
        }
    """,
    "get_annotation": """
        query GetAnnotation($id: String!) {
            annotation(id: $id) {
                id
                imageId
                boundingBox {
                    x
                    y
                    width
                    height
                }
                tags
                description
                confidence
                source
            }
        }
    """,
    "annotations_by_image": """
        query AnnotationsByImage($imageId: String!) {
            annotationsByImage(imageId: $imageId) {
                id
                description
                source
            }
        }
    """,
    "create_annotation": """
        mutation CreateAnnotation($input: AnnotationCreateInput!) {
            createAnnotation(input: $input) {
                ... on AnnotationSuccessResult {
                    data {
                        id
                        imageId
                        description
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "update_annotation": """
        mutation UpdateAnnotation($id: String!, $input: AnnotationUpdateInput!) {
            updateAnnotation(id: $id, input: $input) {
                ... on AnnotationSuccessResult {
                    data {
                        id
                        description
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "delete_annotation": """
        mutation DeleteAnnotation($id: String!) {
            deleteAnnotation(id: $id) {
                deleted
                message
            }
        }
    """,
    # ML Job queries
    "list_ml_jobs": """
        query {
            mlJobs {
                items {
                    id
                    imageUrl
                    endpoint
                    status
                    errorMessage
                    createdAt
                    updatedAt
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
                totalCount
            }
        }
    """,
    "get_ml_job": """
        query GetMLJob($id: String!) {
            mlJob(id: $id) {
                id
                imageUrl
                endpoint
                status
                errorMessage
                predictions {
                    id
                    description
                }
            }
        }
    """,
    "ml_jobs_by_status": """
        query MLJobsByStatus($status: String!) {
            mlJobsByStatus(status: $status) {
                id
                imageUrl
                status
            }
        }
    """,
    "ml_jobs_by_image_url": """
        query MLJobsByImageUrl($imageUrl: String!) {
            mlJobsByImageUrl(imageUrl: $imageUrl) {
                id
                imageUrl
                endpoint
                status
            }
        }
    """,
    "create_ml_job": """
        mutation CreateMLJob($input: MLJobCreateInput!) {
            createMlJob(input: $input) {
                ... on MLJobSuccessResult {
                    data {
                        id
                        imageUrl
                        endpoint
                        status
                    }
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "update_ml_job_status": """
        mutation UpdateMLJobStatus($id: String!, $status: String!, $errorMessage: String) {
            updateMlJobStatus(id: $id, status: $status, errorMessage: $errorMessage) {
                ... on MLJobSuccessResult {
                    data {
                        id
                        status
                        errorMessage
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
    "cancel_ml_job": """
        mutation CancelMLJob($id: String!) {
            cancelMlJob(id: $id) {
                ... on MLJobSuccessResult {
                    data {
                        id
                        status
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
    """,
}
