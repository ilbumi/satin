import strawberry


@strawberry.type
class Annotation:
    text: str | None = None
    tags: list[str] | None = None

    def __str__(self):
        """Get string representation of the Annotation."""
        return f"Annotation(text={self.text}, tags={self.tags})"


@strawberry.type
class BBox:
    x: float
    y: float
    width: float
    height: float
    annotation: Annotation

    def __str__(self):
        """Get string representation of the BBox."""
        return f"BBox(x={self.x}, y={self.y}, width={self.width}, height={self.height}, annotation={self.annotation})"
