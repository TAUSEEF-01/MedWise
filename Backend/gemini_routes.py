from fastapi import APIRouter, File, UploadFile
from gemini_service import generate_text_from_image

router = APIRouter(prefix="/gemini", tags=["Gemini"])

@router.post("/upload-image/")
async def upload_image(
    file: UploadFile = File(...)
):
    print("Gemini API upload-image called")
    print(f"Received file: {file}")
    """
    Uploads an image, generates text from it using the Gemini API,
    and returns the generated text.
    """
    return await generate_text_from_image(file)
