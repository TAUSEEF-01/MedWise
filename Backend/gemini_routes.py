from fastapi import APIRouter, File, UploadFile, HTTPException
from gemini_service import generate_text_from_image
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gemini", tags=["Gemini"])


@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    """
    Uploads an image, generates text from it using the Gemini API,
    and returns the generated text.
    """
    logger.info("=== GEMINI UPLOAD ENDPOINT CALLED ===")
    logger.info(f"Received file: {file.filename}")
    logger.info(f"Content type: {file.content_type}")
    logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")

    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        result = await generate_text_from_image(file)
        logger.info("Successfully processed file upload")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in upload_image endpoint: {str(e)}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
