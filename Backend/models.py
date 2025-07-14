from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Annotated, List
from datetime import datetime


class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=3, max_length=50)
    user_email: EmailStr
    password: str = Field(..., min_length=4)
    phone_no: str = Field(..., min_length=10, max_length=15)
    blood_group: str = Field(..., pattern=r"^(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)$")
    sex: str = Field(..., pattern=r"^(male|female|other)$")


class UserLogin(BaseModel):
    user_email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    phone_no: str
    blood_group: str
    sex: str
    created_at: datetime


class UserInDB(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    password: str  # hashed password
    phone_no: str
    blood_group: str
    sex: str
    created_at: datetime


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



class BloodPressure(BaseModel):
    systolic: int
    diastolic: int

class AddBloodPressureReading(BaseModel):
    value: BloodPressure

# Model for a BP reading as stored in the database
class BloodPressureReading(BaseModel):
    value: BloodPressure
    date: datetime

# Model for adding a single Glucose reading via the API
class AddGlucoseReading(BaseModel):
    value: float

# Model for a Glucose reading as stored in the database
class GlucoseReading(BaseModel):
    value: float
    date: datetime

# The main model for the document in the 'user_readings' collection
class UserReadings(BaseModel):
    user_id: str
    blood_pressure_readings: List[BloodPressureReading] = []
    glucose_readings: List[GlucoseReading] = []

    # user_id: str
    # original_filename: str
    # file_path: str
    # uploaded_at: datetime
    # status: str = "processing"  # "processing", "completed", "failed"
    # analysis_result: Optional[dict] = None
    # error_message: Optional[str] = None
    # completed_at: Optional[datetime] = None

    # model_config = {
    #     "populate_by_name": True,
    #     "arbitrary_types_allowed": True,
    # }



# models for user_drugs
class Drug(BaseModel):
    drug_name: str
    dosage: str
    instruction: str  # Note: singular form as requested
    duration: str


class UserDrugs(BaseModel):
    id: Optional[str] = Field(None, alias='_id')
    user_id: str
    active_drugs: List[Drug]
    all_drugs: List[Drug]
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
