"""Pydantic model for Project."""

from pydantic import BaseModel, Field, field_validator

from satin.validators import validate_description, validate_project_name


class Project(BaseModel):
    """Project model for annotation projects."""

    id: str = Field(..., description="Unique identifier for the project")
    name: str = Field(..., description="Name of the project", min_length=1, max_length=255)
    description: str = Field(default="", description="Description of the project", max_length=5000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate project name."""
        return validate_project_name(v)

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Validate project description."""
        return validate_description(v)

    def __str__(self) -> str:
        """Get string representation of the Project."""
        return f"Project(id={self.id}, name={self.name}, description={self.description})"
