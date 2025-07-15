"""
Script to create a test user for authentication testing
"""

import asyncio
from auth_service import create_user
from models import UserCreate
from database import connect_to_mongo, close_mongo_connection


async def create_test_user():
    """Create a test user"""
    await connect_to_mongo()

    try:
        test_user = UserCreate(
            user_name="Test User",
            user_email="test@example.com",
            password="password123",
            blood_group="O+",
            sex="male",
        )

        user = await create_user(test_user)
        print(f"Test user created successfully: {user.user_email}")
        print(f"User ID: {user.user_id}")

    except Exception as e:
        print(f"Error creating test user: {e}")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(create_test_user())
