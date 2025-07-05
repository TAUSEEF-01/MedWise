from fastapi import UploadFile, HTTPException
import os
import uuid
from datetime import datetime
from typing import Optional
import asyncio
import logging
from models import UserResponse, ImageUploadResponse, ImageAnalysisStatus, ImageUploadInDB
from database import get_image_collection
from gemini_service import generate_text_from_image
import mimetypes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageUploadService:
    def __init__(self):
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB

    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type and size"""
        logger.info(f"Validating file: {file.filename}, content_type: {file.content_type}")
        
        if not file.filename:
            logger.warning("File validation failed: No filename provided")
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file extension
        file_extension = os.path.splitext(file.filename.lower())[1]
        if file_extension not in self.allowed_extensions:
            logger.warning(f"File validation failed: Invalid extension '{file_extension}' for file '{file.filename}'")
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Supported types: {', '.join(self.allowed_extensions)}"
            )
        
        # Check MIME type
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type or not mime_type.startswith('image/'):
            logger.warning(f"File validation failed: Invalid MIME type '{mime_type}' for file '{file.filename}'")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        logger.info(f"File validation successful: {file.filename} (extension: {file_extension}, mime: {mime_type})")

    async def upload_image(self, file: UploadFile, current_user: UserResponse) -> ImageUploadResponse:
        """Upload image and start async processing"""
        logger.info(f"Starting image upload for user: {current_user.email} (ID: {current_user.id})")
        
        # Validate file
        self._validate_file(file)
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        logger.info(f"Generated image ID: {image_id} for file: {file.filename}")
        
        # Create file path
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{image_id}{file_extension}"
        file_path = os.path.join("uploads", filename)
        
        # Ensure uploads directory exists
        os.makedirs("uploads", exist_ok=True)
        logger.info(f"Saving file to: {file_path}")
        
        try:
            # Save file to disk
            contents = await file.read()
            file_size = len(contents)
            logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
            
            # Validate file size
            if file_size > self.max_file_size:
                logger.warning(f"File too large: {file_size} bytes > {self.max_file_size} bytes")
                raise HTTPException(
                    status_code=400, 
                    detail=f"File too large. Maximum size: {self.max_file_size // (1024*1024)}MB"
                )
            
            with open(file_path, "wb") as f:
                f.write(contents)
            logger.info(f"File successfully saved to disk: {file_path}")
            
            # Create database record
            upload_record = ImageUploadInDB(
                _id=image_id,
                user_id=current_user.id,
                original_filename=file.filename,
                file_path=file_path,
                uploaded_at=datetime.utcnow(),
                status="processing"
            )
            
            # Save to database
            collection = get_image_collection()
            await collection.insert_one(upload_record.model_dump(by_alias=True))
            logger.info(f"Database record created for image ID: {image_id}")
            
            # Start async processing (fire and forget)
            asyncio.create_task(self._process_image_async(image_id, file_path, current_user))
            logger.info(f"Started async processing task for image ID: {image_id}")
            
            response = ImageUploadResponse(
                status="success",
                imageId=image_id
            )
            logger.info(f"Image upload successful - returning image ID to frontend: {image_id}")
            return response
            
        except Exception as e:
            # Clean up file if it was created
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up file after error: {file_path}")
            
            logger.error(f"Upload failed for image ID {image_id}: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            else:
                raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    async def _process_image_async(self, image_id: str, file_path: str, current_user: UserResponse):
        """Process image asynchronously using Gemini API"""
        logger.info(f"Starting async processing for image ID: {image_id}")
        collection = get_image_collection()
        
        try:
            # Create a mock UploadFile object for the gemini service
            class MockUploadFile:
                def __init__(self, file_path: str):
                    self.filename = os.path.basename(file_path)
                    self._file_path = file_path
                
                async def read(self):
                    with open(self._file_path, 'rb') as f:
                        return f.read()
            
            mock_file = MockUploadFile(file_path)
            logger.info(f"Created mock file object for Gemini API processing: {image_id}")
            
            # Process with Gemini API
            logger.info(f"Sending image {image_id} to Gemini API for analysis")
            result = await generate_text_from_image(mock_file, current_user)
            logger.info(f"Gemini API analysis completed for image {image_id}")
            
            # Update database with results
            await collection.update_one(
                {"_id": image_id},
                {
                    "$set": {
                        "status": "completed",
                        "analysis_result": result,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Database updated with successful analysis results for image {image_id}")
            
        except Exception as e:
            # Update database with error
            error_message = str(e)
            logger.error(f"Error processing image {image_id}: {error_message}")
            
            await collection.update_one(
                {"_id": image_id},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": error_message,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Database updated with error status for image {image_id}")
            print(f"Error processing image {image_id}: {error_message}")

    async def get_analysis_result(self, image_id: str, current_user: UserResponse) -> ImageAnalysisStatus:
        """Get analysis result for an uploaded image"""
        logger.info(f"Fetching analysis result for image ID: {image_id}, user: {current_user.email}")
        collection = get_image_collection()
        
        # Find the image record
        record = await collection.find_one({
            "_id": image_id,
            "user_id": current_user.id  # Ensure user can only access their own images
        })
        
        if not record:
            logger.warning(f"Image not found or access denied - image ID: {image_id}, user: {current_user.email}")
            raise HTTPException(status_code=404, detail="Image not found")
        
        logger.info(f"Found image record for ID: {image_id}, status: {record['status']}")
        
        # Convert to response model
        response = ImageAnalysisStatus(
            status=record["status"],
            imageId=image_id,
            uploadedAt=record["uploaded_at"],
            completedAt=record.get("completed_at"),
            error=record.get("error_message"),
            data=record.get("analysis_result")
        )
        
        logger.info(f"Returning analysis result for image ID: {image_id} with status: {response.status}")
        return response

    async def list_user_images(self, current_user: UserResponse, limit: int = 20, skip: int = 0):
        """List user's uploaded images"""
        logger.info(f"Listing images for user: {current_user.email}, limit: {limit}, skip: {skip}")
        collection = get_image_collection()
        
        cursor = collection.find(
            {"user_id": current_user.id}
        ).sort("uploaded_at", -1).skip(skip).limit(limit)
        
        images = []
        async for record in cursor:
            images.append({
                "imageId": record["_id"],
                "originalFilename": record["original_filename"],
                "uploadedAt": record["uploaded_at"],
                "status": record["status"],
                "completedAt": record.get("completed_at")
            })
        
        logger.info(f"Found {len(images)} images for user: {current_user.email}")
        return images
