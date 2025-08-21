from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from satin.services.file_upload import FileUploadService

router = APIRouter(prefix="/uploads", tags=["uploads"])


def get_upload_service() -> FileUploadService:
    """Dependency to get file upload service."""
    return FileUploadService()


@router.post("/")
async def upload_file(
    file: Annotated[UploadFile, File()], upload_service: Annotated[FileUploadService, Depends(get_upload_service)]
) -> dict[str, Any]:
    """Upload an image file.

    Args:
        file: The image file to upload
        upload_service: File upload service dependency

    Returns:
        Dict containing file metadata and URL

    """
    try:
        result = await upload_service.upload_image(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e!s}") from e
    else:
        return {"success": True, "data": result}


@router.get("/{filename}")
async def get_uploaded_file(
    filename: str, upload_service: Annotated[FileUploadService, Depends(get_upload_service)]
) -> FileResponse:
    """Serve an uploaded file.

    Args:
        filename: Name of the file to serve
        upload_service: File upload service dependency

    Returns:
        The requested file

    """
    file_path = upload_service.get_file_path(filename)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=str(file_path), filename=filename, media_type="application/octet-stream")


@router.delete("/{filename}")
async def delete_uploaded_file(
    filename: str, upload_service: Annotated[FileUploadService, Depends(get_upload_service)]
) -> dict[str, Any]:
    """Delete an uploaded file.

    Args:
        filename: Name of the file to delete
        upload_service: File upload service dependency

    Returns:
        Success status

    """
    success = upload_service.delete_file(filename)

    if not success:
        raise HTTPException(status_code=404, detail="File not found")

    return {"success": True, "message": "File deleted successfully"}
