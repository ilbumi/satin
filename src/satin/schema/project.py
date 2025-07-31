import strawberry


@strawberry.type
class Project:
    id: strawberry.ID
    name: str
    description: str

    def __str__(self) -> str:
        """Get string representation of the Project."""
        return f"Project(id={self.id}, name={self.name}, description={self.description})"
