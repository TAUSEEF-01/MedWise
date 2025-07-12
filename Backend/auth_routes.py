from fastapi import APIRouter, HTTPException, status, Response, Request, Header
from fastapi.responses import JSONResponse
from models import UserCreate, UserLogin, UserResponse
from auth_service import create_user, authenticate_user, get_user_by_id
from typing import Optional
import uuid
from datetime import datetime, timedelta
import logging
import jwt
from config import SECRET_KEY, ALGORITHM

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.PyJWTError:
        return None


@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await create_user(user_data)

        # Create JWT token
        access_token_expires = timedelta(days=7)
        access_token = create_access_token(
            data={"sub": user.user_id}, expires_delta=access_token_expires
        )

        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "user_email": user.user_email,
                "phone_no": user.phone_no,
                "blood_group": user.blood_group,
                "sex": user.sex,
                "created_at": user.created_at.isoformat(),
            },
        }

        return response_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(login_data: UserLogin):
    """Login user"""
    try:
        logger.info(f"Login attempt for email: {login_data.user_email}")
        user = await authenticate_user(login_data)
        logger.info(f"User authenticated successfully: {user.user_email}")

        # Create JWT token
        access_token_expires = timedelta(days=7)
        access_token = create_access_token(
            data={"sub": user.user_id}, expires_delta=access_token_expires
        )

        logger.info(f"Token created for user: {user.user_email}")

        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "user_email": user.user_email,
                "phone_no": user.phone_no,
                "blood_group": user.blood_group,
                "sex": user.sex,
                "created_at": user.created_at.isoformat(),
            },
        }

        logger.info(f"Login successful for user: {user.user_email}")
        return response_data
    except Exception as e:
        logger.error(f"Login failed for email {login_data.user_email}: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout():
    """Logout user (with JWT, just remove token from client)"""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user info"""
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("No authorization header or invalid format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    token = authorization.split(" ")[1]
    user_id = verify_token(token)

    if not user_id:
        logger.warning("Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user = await get_user_by_id(user_id)
    logger.info(f"Current user retrieved: {user.user_email}")

    return UserResponse(
        user_id=user.user_id,
        user_name=user.user_name,
        user_email=user.user_email,
        phone_no=user.phone_no,
        blood_group=user.blood_group,
        sex=user.sex,
        created_at=user.created_at,
    )


@router.get("/check")
async def check_auth_status(authorization: Optional[str] = Header(None)):
    """Check if user is authenticated"""
    logger.info(f"Auth check with authorization header: {authorization is not None}")

    if not authorization or not authorization.startswith("Bearer "):
        logger.info("No authorization header or invalid format")
        return {"authenticated": False, "message": "No authorization header"}

    token = authorization.split(" ")[1]
    user_id = verify_token(token)

    if not user_id:
        logger.info("Invalid or expired token")
        return {"authenticated": False, "message": "Invalid or expired token"}

    logger.info(f"Valid token found for user: {user_id}")
    return {"authenticated": True, "user_id": user_id}


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify auth routes are working"""
    return {
        "message": "Auth routes are working!",
        "timestamp": datetime.utcnow().isoformat(),
        "available_endpoints": [
            "/auth/signup",
            "/auth/login",
            "/auth/logout",
            "/auth/me",
            "/auth/check",
        ],
    }
    