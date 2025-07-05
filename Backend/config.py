import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Google AI Configuration
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

# Application Configuration
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
UPLOAD_MAX_SIZE = int(os.getenv("UPLOAD_MAX_SIZE", "10485760"))  # 10MB default

# Allowed file extensions for uploads
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "bmp", "tiff"}

# Upload directory
UPLOAD_DIRECTORY = "uploads"