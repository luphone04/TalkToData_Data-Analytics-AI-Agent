from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from services.agent_service import AgentService
from core.config import settings

router = APIRouter(prefix="/api/files", tags=["files"])


class FileInfo(BaseModel):
    """File information response."""
    filename: str
    size: int
    modified: float


class FileListResponse(BaseModel):
    """Response for listing files."""
    files: list[FileInfo]


class UploadResponse(BaseModel):
    """Response for file upload."""
    filename: str
    path: str
    message: str


class DeleteResponse(BaseModel):
    """Response for file deletion."""
    success: bool
    message: str


@router.get("", response_model=FileListResponse)
async def list_files(user_id: str = "anonymous"):
    """List all data files for the user."""
    service = AgentService(user_id=user_id)
    files = service.list_files()
    return FileListResponse(files=[FileInfo(**f) for f in files])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = "anonymous",
):
    """
    Upload a CSV or Excel file.

    Supported formats: .csv, .xlsx, .xls
    Max file size: 10MB
    """
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Supported: {settings.allowed_extensions}",
        )

    # Read and validate file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.max_file_size_mb}MB",
        )

    # Save file
    service = AgentService(user_id=user_id)
    path = service.save_file(file.filename, content)

    return UploadResponse(
        filename=file.filename,
        path=path,
        message=f"Successfully uploaded {file.filename}",
    )


@router.delete("/{filename}", response_model=DeleteResponse)
async def delete_file(filename: str, user_id: str = "anonymous"):
    """Delete a data file."""
    service = AgentService(user_id=user_id)
    success = service.delete_file(filename)

    if not success:
        raise HTTPException(status_code=404, detail="File not found")

    return DeleteResponse(
        success=True,
        message=f"Successfully deleted {filename}",
    )
