import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class MongoDB:
    client = None
    database = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Create database connection"""
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise ValueError("MONGODB_URI not found in environment variables")

    mongodb.client = AsyncIOMotorClient(mongodb_uri, server_api=ServerApi("1"))
    mongodb.database = mongodb.client.medwise  # Use your database name here

    # Test the connection
    try:
        await mongodb.client.admin.command("ping")
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")


async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()


def get_database():
    """Get database instance"""
    return mongodb.database


def get_user_collection():
    """Get user collection"""
    if mongodb.database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return mongodb.database.user


def get_image_collection():
    """Get image uploads collection"""
    if mongodb.database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return mongodb.database.image_uploads


def get_gemini_response_collection():
    """Get Gemini API response collection"""
    if mongodb.database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return mongodb.database.report_analysis_responses
