from datetime import datetime
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError
from models import UserCreate, UserLogin, UserInDB, UserResponse
from auth import hash_password, verify_password
from database import get_user_collection
from bson import ObjectId

class UserService:
    def __init__(self):
        self.collection = None
    
    def _get_collection(self):
        """Get user collection with lazy loading"""
        if self.collection is None:
            self.collection = get_user_collection()
        return self.collection

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        collection = self._get_collection()
        
        # Check if user already exists
        existing_user = await collection.find_one({
            "$or": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        })
        
        if existing_user:
            if existing_user["email"] == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        user_doc = {
            "email": user_data.email,
            "username": user_data.username,
            "password": hashed_password,
            "full_name": user_data.full_name,
            "gender": user_data.gender,
            "dob": user_data.dob,
            "blood_group": user_data.blood_group,
            "created_at": datetime.utcnow()
        }
        
        try:
            # Insert user into database
            result = await collection.insert_one(user_doc)
            user_doc["_id"] = str(result.inserted_id)
            
            # Return user response (without password)
            return UserResponse(**user_doc)
            
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )

    async def authenticate_user(self, user_credentials: UserLogin) -> UserInDB:
        """Authenticate user login"""
        collection = self._get_collection()
        
        # Find user by email
        user = await collection.find_one({"email": user_credentials.email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user["_id"] = str(user["_id"])
        return UserInDB(**user)

    async def get_user_by_email(self, email: str) -> UserInDB:
        """Get user by email"""
        collection = self._get_collection()
        user = await collection.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        user["_id"] = str(user["_id"])
        return UserInDB(**user)

    async def get_user_by_id(self, user_id: str) -> UserResponse:
        """Get user by ID"""
        collection = self._get_collection()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID"
            )
        
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        user["_id"] = str(user["_id"])
        return UserResponse(**user)
