from fastapi import APIRouter, File, UploadFile, Query
from typing import List
import logging
from models import ImageUploadResponse, ImageAnalysisStatus
from image_service import ImageUploadService
from database import get_image_collection

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Image Upload & Analysis"])
image_service = ImageUploadService()


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file for analysis.

    - **file**: Image file to upload (PNG, JPEG, GIF, BMP, WebP)
    - **Returns**: Success status and unique image ID

    The image will be processed asynchronously. Use the imageId to check analysis status.
    """
    logger.info(f"API POST /upload called with file: {file.filename}")
    result = await image_service.upload_image(file)
    logger.info(f"API POST /upload response - imageId: {result.imageId}")
    return result


@router.get("/analyze/{image_id}", response_model=ImageAnalysisStatus)
async def get_analysis_result(image_id: str):
    """
    Get analysis result for a previously uploaded image.

    - **image_id**: The unique ID returned from the upload endpoint
    - **Returns**: Analysis status and result (if completed)

    Status can be:
    - "processing": Analysis is still in progress
    - "completed": Analysis finished successfully
    - "failed": Analysis failed with error
    """
    logger.info(f"API GET /analyze/{image_id} called")
    result = await image_service.get_analysis_result(image_id)
    logger.info(f"API GET /analyze/{image_id} response - status: {result.status}")
    return result


@router.get("/images", response_model=List[dict])
async def list_images(
    limit: int = Query(20, ge=1, le=100, description="Number of images to return"),
    skip: int = Query(0, ge=0, description="Number of images to skip"),
):
    """
    List uploaded images with their status.

    - **limit**: Maximum number of images to return (1-100)
    - **skip**: Number of images to skip for pagination
    - **Returns**: List of images with status information
    """
    logger.info(f"API GET /images called (limit: {limit}, skip: {skip})")
    result = await image_service.list_images(limit, skip)
    logger.info(f"API GET /images response - returned {len(result)} images")
    return result
    # logger.info(
    #     f"API GET /images called by user: {current_user.email} (limit: {limit}, skip: {skip})"
    # )
    # result = await image_service.list_user_images(current_user, limit, skip)
    # logger.info(
    #     f"API GET /images response - returned {len(result)} images for user: {current_user.email}"
    # )
    # return result


@router.get("/images/all")
async def get_all_images():
    """
    Returns all image upload documents with all fields, converting ObjectId and datetime for frontend.
    """
    collection = get_image_collection()
    docs = await collection.find({}).to_list(length=1000)
    for doc in docs:
        # Convert ObjectId to string
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        # Convert datetime fields to ISO string
        for dt_field in ["uploaded_at", "completed_at"]:
            if dt_field in doc and doc[dt_field]:
                doc[dt_field] = (
                    doc[dt_field].isoformat()
                    if hasattr(doc[dt_field], "isoformat")
                    else str(doc[dt_field])
                )
    return {"images": docs}
