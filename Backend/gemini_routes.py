from fastapi import APIRouter, File, UploadFile, Depends
from gemini_service import generate_text_from_image
from routes import get_current_user
from models import UserResponse

router = APIRouter(prefix="/gemini", tags=["Gemini"])

@router.post("/upload-image/")
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Uploads an image, generates text from it using the Gemini API,
    and returns the generated text.
    Requires authentication.
    """
    return await generate_text_from_image(file, current_user)
