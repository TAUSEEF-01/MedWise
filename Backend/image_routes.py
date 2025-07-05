from fastapi import APIRouter, File, UploadFile, Depends, Query
from typing import List
import logging
from models import UserResponse, ImageUploadResponse, ImageAnalysisStatus
from routes import get_current_user
from image_service import ImageUploadService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Image Upload & Analysis"])
image_service = ImageUploadService()

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload an image file for analysis.
    
    - **file**: Image file to upload (PNG, JPEG, GIF, BMP, WebP)
    - **Returns**: Success status and unique image ID
    
    The image will be processed asynchronously. Use the imageId to check analysis status.
    """
    logger.info(f"API POST /upload called by user: {current_user.email} with file: {file.filename}")
    result = await image_service.upload_image(file, current_user)
    logger.info(f"API POST /upload response - imageId: {result.imageId} sent to frontend for user: {current_user.email}")
    return result

@router.get("/analyze/{image_id}", response_model=ImageAnalysisStatus)
async def get_analysis_result(
    image_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get analysis result for a previously uploaded image.
    
    - **image_id**: The unique ID returned from the upload endpoint
    - **Returns**: Analysis status and result (if completed)
    
    Status can be:
    - "processing": Analysis is still in progress
    - "completed": Analysis finished successfully
    - "failed": Analysis failed with error
    """
    logger.info(f"API GET /analyze/{image_id} called by user: {current_user.email}")
    result = await image_service.get_analysis_result(image_id, current_user)
    logger.info(f"API GET /analyze/{image_id} response - status: {result.status} for user: {current_user.email}")
    return result

@router.get("/images", response_model=List[dict])
async def list_user_images(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100, description="Number of images to return"),
    skip: int = Query(0, ge=0, description="Number of images to skip")
):
    """
    List user's uploaded images with their status.
    
    - **limit**: Maximum number of images to return (1-100)
    - **skip**: Number of images to skip for pagination
    - **Returns**: List of user's images with status information
    """
    logger.info(f"API GET /images called by user: {current_user.email} (limit: {limit}, skip: {skip})")
    result = await image_service.list_user_images(current_user, limit, skip)
    logger.info(f"API GET /images response - returned {len(result)} images for user: {current_user.email}")
    return result
