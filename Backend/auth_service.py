from passlib.context import CryptContext
from datetime import datetime, timedelta
from database import get_users_collection
from models import UserCreate, UserInDB, UserLogin
import uuid
from fastapi import HTTPException, status

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


async def create_user(user_data: UserCreate) -> UserInDB:
    """Create a new user"""
    users_collection = get_users_collection()

    # Check if user already exists
    existing_user = await users_collection.find_one(
        {"user_email": user_data.user_email}
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Create user document
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)

    user_doc = {
        "user_id": user_id,
        "user_name": user_data.user_name,
        "user_email": user_data.user_email,
        "password": hashed_password,
        "blood_group": user_data.blood_group,
        "sex": user_data.sex,
        "created_at": datetime.utcnow(),
    }

    await users_collection.insert_one(user_doc)
    return UserInDB(**user_doc)


async def authenticate_user(login_data: UserLogin) -> UserInDB:
    """Authenticate user with email and password"""
    users_collection = get_users_collection()

    user = await users_collection.find_one({"user_email": login_data.user_email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    return UserInDB(**user)


async def get_user_by_id(user_id: str) -> UserInDB:
    """Get user by user_id"""
    users_collection = get_users_collection()

    user = await users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserInDB(**user)
