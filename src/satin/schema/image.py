import strawberry


@strawberry.type
class Image:
    id: strawberry.ID
    url: str

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
