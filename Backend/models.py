from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Annotated, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=1, max_length=100)
    gender: str = Field(..., pattern=r"^(male|female|other)$")
    dob: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD format
    blood_group: str = Field(..., pattern=r"^(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: Annotated[str, Field(alias="_id")]
    email: EmailStr
    username: str
    full_name: str
    gender: str
    dob: str
    blood_group: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class UserInDB(BaseModel):
    id: Annotated[str, Field(alias="_id")]
    email: EmailStr
    username: str
    password: str  # hashed password
    full_name: str
    gender: str
    dob: str
    blood_group: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Document Processing Models
class Doctor(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None

class Medication(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None

class Test(BaseModel):
    name: Optional[str] = None

class DocumentResponse(BaseModel):
    user_id: str
    document_id: str
    type: str = Field(..., pattern=r"^(prescription|report)$")
    uploaded_at: datetime
    doctor: Optional[Doctor] = None
    diagnosis: Optional[List[str]] = None
    medications: Optional[List[Medication]] = None
    tests_recommended: Optional[List[Test]] = None
    follow_up_days: Optional[int] = None
    notes: Optional[str] = None

class DocumentInDB(BaseModel):
    id: Annotated[str, Field(alias="_id")]
    user_id: str
    document_id: str
    type: str
    uploaded_at: datetime
    original_filename: str
    file_path: str
    doctor: Optional[Doctor] = None
    diagnosis: Optional[List[str]] = None
    medications: Optional[List[Medication]] = None
    tests_recommended: Optional[List[Test]] = None
    follow_up_days: Optional[int] = None
    notes: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

# Image Upload and Analysis Models
class ImageUploadResponse(BaseModel):
    status: str = "success"
    imageId: str

class ImageAnalysisStatus(BaseModel):
    status: str  # "processing", "completed", "failed"
    imageId: str
    uploadedAt: datetime
    completedAt: Optional[datetime] = None
    error: Optional[str] = None
    data: Optional[dict] = None

class ImageUploadInDB(BaseModel):
    id: Annotated[str, Field(alias="_id")]
    user_id: str
    original_filename: str
    file_path: str
    uploaded_at: datetime
    status: str = "processing"  # "processing", "completed", "failed"
    analysis_result: Optional[dict] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
