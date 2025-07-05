"""
Database setup script to create indexes for better performance
Run this script once to set up the database indexes
"""
import asyncio
from database import connect_to_mongo, get_user_collection, close_mongo_connection

async def create_indexes():
    """Create database indexes"""
    await connect_to_mongo()
    
    user_collection = get_user_collection()
    
    # Create unique indexes for email and username
    await user_collection.create_index("email", unique=True)
    await user_collection.create_index("username", unique=True)
    
    # Create index for created_at for sorting
    await user_collection.create_index("created_at")
    
    print("Database indexes created successfully!")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_indexes())
