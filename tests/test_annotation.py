from satin.schema.annotation import Annotation, BBox


class TestAnnotation:
    """Test cases for Annotation schema."""

    def test_annotation_creation_with_text_and_tags(self):
        """Test Annotation object creation with text and tags."""
        annotation = Annotation(text="test object", tags=["object", "test"])
        assert annotation.text == "test object"
        assert annotation.tags == ["object", "test"]

    def test_annotation_creation_with_text_only(self):
        """Test Annotation object creation with text only."""
        annotation = Annotation(text="test object")
        assert annotation.text == "test object"
        assert annotation.tags is None

    def test_annotation_creation_with_tags_only(self):
        """Test Annotation object creation with tags only."""
        annotation = Annotation(tags=["object", "test"])
        assert annotation.text is None
        assert annotation.tags == ["object", "test"]

    def test_annotation_creation_empty(self):
        """Test Annotation object creation with no parameters."""
        annotation = Annotation()
        assert annotation.text is None
        assert annotation.tags is None

    def test_annotation_str_representation(self):
        """Test Annotation string representation."""
        annotation = Annotation(text="test object", tags=["object", "test"])
        expected = "Annotation(text=test object, tags=['object', 'test'])"
        assert str(annotation) == expected

    def test_annotation_str_representation_none_values(self):
        """Test Annotation string representation with None values."""
        annotation = Annotation()
        expected = "Annotation(text=None, tags=None)"
        assert str(annotation) == expected


class TestBBox:
    """Test cases for BBox schema."""

    def test_bbox_creation(self):
        """Test BBox object creation."""
        annotation = Annotation(text="test object", tags=["object"])
        bbox = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation)

        assert bbox.x == 10.0
        assert bbox.y == 20.0
        assert bbox.width == 100.0
        assert bbox.height == 200.0
        assert bbox.annotation.text == "test object"
        assert bbox.annotation.tags == ["object"]

    def test_bbox_creation_with_float_coordinates(self):
        """Test BBox object creation with various float coordinates."""
        annotation = Annotation(text="precise object")
        bbox = BBox(x=10.5, y=20.25, width=100.75, height=200.125, annotation=annotation)

        assert bbox.x == 10.5
        assert bbox.y == 20.25
        assert bbox.width == 100.75
        assert bbox.height == 200.125

    def test_bbox_creation_with_zero_coordinates(self):
        """Test BBox object creation with zero coordinates."""
        annotation = Annotation(text="origin object")
        bbox = BBox(x=0.0, y=0.0, width=0.0, height=0.0, annotation=annotation)

        assert bbox.x == 0.0
        assert bbox.y == 0.0
        assert bbox.width == 0.0
        assert bbox.height == 0.0

    def test_bbox_creation_with_negative_coordinates(self):
        """Test BBox object creation with negative coordinates."""
        annotation = Annotation(text="negative object")
        bbox = BBox(x=-10.0, y=-20.0, width=100.0, height=200.0, annotation=annotation)

        assert bbox.x == -10.0
        assert bbox.y == -20.0
        assert bbox.width == 100.0
        assert bbox.height == 200.0

    def test_bbox_str_representation(self):
        """Test BBox string representation."""
        annotation = Annotation(text="test object", tags=["object"])
        bbox = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation)

        expected = (
            "BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=Annotation(text=test object, tags=['object']))"
        )
        assert str(bbox) == expected

    def test_bbox_with_empty_annotation(self):
        """Test BBox with empty annotation."""
        annotation = Annotation()
        bbox = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation)

        assert bbox.annotation.text is None
        assert bbox.annotation.tags is None

    def test_bbox_coordinates_precision(self):
        """Test BBox coordinates maintain precision."""
        annotation = Annotation(text="precise")
        bbox = BBox(x=10.123456789, y=20.987654321, width=100.5555, height=200.4444, annotation=annotation)

        assert bbox.x == 10.123456789
        assert bbox.y == 20.987654321
        assert bbox.width == 100.5555
        assert bbox.height == 200.4444


class TestAnnotationBBoxIntegration:
    """Test cases for integration between Annotation and BBox."""

    def test_multiple_bboxes_same_annotation_type(self):
        """Test multiple BBox objects can share similar annotation types."""
        annotation1 = Annotation(text="object 1", tags=["object"])
        annotation2 = Annotation(text="object 2", tags=["object"])

        bbox1 = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation1)
        bbox2 = BBox(x=50.0, y=60.0, width=150.0, height=250.0, annotation=annotation2)

        assert bbox1.annotation.text != bbox2.annotation.text
        assert bbox1.annotation.tags == bbox2.annotation.tags

    def test_bbox_annotation_independence(self):
        """Test that BBox annotations are independent objects."""
        annotation1 = Annotation(text="original", tags=["tag1"])
        annotation2 = Annotation(text="modified", tags=["tag2"])

        bbox1 = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation1)
        bbox2 = BBox(x=10.0, y=20.0, width=100.0, height=200.0, annotation=annotation2)

        # Same coordinates, different annotations
        assert bbox1.x == bbox2.x
        assert bbox1.y == bbox2.y
        assert bbox1.width == bbox2.width
        assert bbox1.height == bbox2.height
        assert bbox1.annotation.text != bbox2.annotation.text
        assert bbox1.annotation.tags != bbox2.annotation.tags
