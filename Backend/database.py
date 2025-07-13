import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


client = None
db = None


async def connect_to_mongo():
    """Create database connection"""
    global client, db
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = AsyncIOMotorClient(mongodb_uri, server_api=ServerApi("1"))
    db = client.medwise  

    # Test the connection
    try:
        await client.admin.command("ping")
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()


def get_database():
    """Get database instance"""
    return db


def get_user_collection():
    """Get user collection"""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.user


def get_image_collection():
    """Get image uploads collection"""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.image_uploads


def get_gemini_response_collection():
    """Get Gemini API response collection"""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.report_analysis_responses


def get_user_readings_collection():
    """Get user readings collection"""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.user_readings


def get_users_collection():
    """Get users collection for authentication"""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.users
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return mongodb.database.users

