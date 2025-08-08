"""Pydantic model for Project."""

from pydantic import BaseModel, Field


class Project(BaseModel):
    """Project model for annotation projects."""

    id: str = Field(..., description="Unique identifier for the project")
    name: str = Field(..., description="Name of the project")
    description: str = Field(..., description="Description of the project")

    def __str__(self) -> str:
        """Get string representation of the Project."""
        return f"Project(id={self.id}, name={self.name}, description={self.description})"
