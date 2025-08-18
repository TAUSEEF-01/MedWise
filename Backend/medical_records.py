from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from typing import List, Dict, Any
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


@router.get("/images/user/{user_id}")
async def get_user_images(user_id: str):
    """
    Get all images uploaded by a specific user.

    - **user_id**: The user's unique ID
    - **Returns**: List of images uploaded by the user
    """
    collection = get_image_collection()
    user_images = await collection.find({"user_id": user_id}).to_list(length=1000)
    for doc in user_images:
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
    return {"images": user_images}


@router.get("/images/user/count/{user_id}")
async def get_user_images_count(user_id: str):
    """
    Get the count of images uploaded by a specific user.

    - **user_id**: The user's unique ID
    - **Returns**: Number of images uploaded by the user
    """
    collection = get_image_collection()
    count = await collection.count_documents({"user_id": user_id})
    return {"count": count}


@router.put("/update-images-details/{image_id}")
async def update_image_data(image_id: str, update_data: Dict[str, Any]):
    """
    Update the data of a particular image using image_id.

    - **image_id**: The unique image ID
    - **update_data**: Dictionary containing the fields to update
    - **Returns**: Updated image document

    Updatable fields include: analysis_result, status, error_message, etc.
    """
    logger.info(f"API PUT /images/{image_id} called with update data")

    collection = get_image_collection()

    # Check if image exists
    existing_image = await collection.find_one({"image_id": image_id})
    if not existing_image:
        logger.error(f"Image with ID {image_id} not found")
        raise HTTPException(status_code=404, detail="Image not found")

    # Remove fields that shouldn't be updated
    forbidden_fields = ["_id", "image_id", "uploaded_at"]
    for field in forbidden_fields:
        if field in update_data:
            del update_data[field]

    # Update the document
    result = await collection.update_one(
        {"image_id": image_id},
        {"$set": update_data},
    )

    if result.modified_count == 0:
        logger.warning(f"No changes made to image {image_id}")

    # Fetch and return updated document
    updated_doc = await collection.find_one({"image_id": image_id})

    # Convert ObjectId and datetime fields for frontend
    if "_id" in updated_doc:
        updated_doc["_id"] = str(updated_doc["_id"])
    for dt_field in ["uploaded_at", "completed_at"]:
        if dt_field in updated_doc and updated_doc[dt_field]:
            updated_doc[dt_field] = (
                updated_doc[dt_field].isoformat()
                if hasattr(updated_doc[dt_field], "isoformat")
                else str(updated_doc[dt_field])
            )

    logger.info(f"Image {image_id} updated successfully")
    return {"message": "Image updated successfully", "image": updated_doc}
