import asyncio
import io
import uuid
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile
from PIL import Image

from satin.config import config


class FileUploadService:
    """Service for handling file uploads."""

    def __init__(self):
        """Initialize the file upload service."""
        self.upload_dir = Path(config.upload_directory)
        self.max_file_size = config.max_file_size  # 10MB default
        self.allowed_mime_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
            "image/tiff",
        }

        # Create upload directory if it doesn't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file."""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        if not file.content_type:
            raise HTTPException(status_code=400, detail="No content type provided")

        if file.content_type not in self.allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. "
                f"Allowed types: {', '.join(self.allowed_mime_types)}",
            )

    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename."""
        return Path(filename).suffix.lower()

    async def upload_image(self, file: UploadFile) -> dict[str, Any]:
        """Upload an image file and return metadata.

        Args:
            file: The uploaded file

        Returns:
            Dict containing file metadata and URL

        Raises:
            HTTPException: If validation fails

        """
        # Validate file
        self._validate_file(file)

        # Generate unique filename
        file_extension = self._get_file_extension(file.filename or "image.jpg")
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = self.upload_dir / unique_filename

        # Save file
        try:
            content = await file.read()

            # Additional validation: try to open as image
            try:
                with Image.open(io.BytesIO(content)) as img:
                    width, height = img.size
                    format_name = img.format or "UNKNOWN"
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image file: {e!s}") from e

            # Write file to disk asynchronously
            await asyncio.to_thread(file_path.write_bytes, content)

        except Exception as e:
            if file_path.exists():
                file_path.unlink()  # Clean up partial file
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e!s}") from e

        # Generate accessible URL
        file_url = f"{config.base_url}/uploads/{unique_filename}"

        return {
            "url": file_url,
            "filename": file.filename or unique_filename,
            "size": len(content),
            "mime_type": file.content_type,
            "width": width,
            "height": height,
            "format": format_name,
            "path": str(file_path),
        }

    def delete_file(self, filename: str) -> bool:
        """Delete an uploaded file."""
        try:
            file_path = self.upload_dir / filename
            if file_path.exists():
                file_path.unlink()
                return True
        except OSError:
            # Handle specific file system errors
            return False
        else:
            return False

    def get_file_path(self, filename: str) -> Path:
        """Get the full path to an uploaded file."""
        return self.upload_dir / filename
