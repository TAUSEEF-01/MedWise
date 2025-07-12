from fastapi import APIRouter, HTTPException, Query, Body, Path
from typing import List, Optional
from datetime import datetime
from models import AddBloodPressureReading, AddGlucoseReading, UserReadings
from database import get_user_readings_collection
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/readings", tags=["Health Readings"])

@router.post("/bp", response_model=dict)
async def add_blood_pressure_reading(
    user_id: str = Query(..., description="User ID"),
    reading: AddBloodPressureReading = Body(...)
):
    """Add a blood pressure reading for a user"""
    logger.info(f"Adding BP reading for user: {user_id}")
    
    try:
        collection = get_user_readings_collection()
        
        # Create new reading with current timestamp
        new_reading = {
            "value": reading.value.dict(),
            "date": datetime.utcnow()
        }
        
        # Update or insert into user_readings collection
        result = await collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"blood_pressure_readings": new_reading},
                "$setOnInsert": {"user_id": user_id, "glucose_readings": []}
            },
            upsert=True
        )
        
        reading_id = str(datetime.utcnow().timestamp())
        return {
            "status": "success",
            "message": "Blood pressure reading added successfully",
            "reading_id": reading_id
        }
        
    except Exception as e:
        logger.error(f"Error adding BP reading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add reading: {str(e)}")

@router.post("/glucose", response_model=dict)
async def add_glucose_reading(
    user_id: str = Query(..., description="User ID"),
    reading: AddGlucoseReading = Body(...)
):
    """Add a glucose reading for a user"""
    logger.info(f"Adding glucose reading for user: {user_id}")
    
    try:
        collection = get_user_readings_collection()
        
        # Create new reading with current timestamp
        new_reading = {
            "value": reading.value,
            "date": datetime.utcnow()
        }
        
        # Update or insert into user_readings collection
        result = await collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"glucose_readings": new_reading},
                "$setOnInsert": {"user_id": user_id, "blood_pressure_readings": []}
            },
            upsert=True
        )
        
        reading_id = str(datetime.utcnow().timestamp())
        return {
            "status": "success",
            "message": "Glucose reading added successfully",
            "reading_id": reading_id
        }
        
    except Exception as e:
        logger.error(f"Error adding glucose reading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add reading: {str(e)}")

@router.get("/", response_model=dict)
async def get_user_readings(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(20, ge=1, le=100, description="Max readings to return per type"),
    skip: int = Query(0, ge=0, description="Number of readings to skip")
):
    """Get a user's health readings"""
    logger.info(f"Getting readings for user: {user_id}")
    
    try:
        collection = get_user_readings_collection()
        doc = await collection.find_one({"user_id": user_id})
        
        if not doc:
            return {
                "user_id": user_id,
                "blood_pressure_readings": [],
                "glucose_readings": []
            }
        
        # Process the data for response
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
            
        # Apply pagination and format dates
        if "blood_pressure_readings" in doc:
            doc["blood_pressure_readings"] = doc["blood_pressure_readings"][skip:skip+limit]
            for reading in doc["blood_pressure_readings"]:
                if "date" in reading:
                    reading["date"] = reading["date"].isoformat() if hasattr(reading["date"], "isoformat") else str(reading["date"])
        
        if "glucose_readings" in doc:
            doc["glucose_readings"] = doc["glucose_readings"][skip:skip+limit]
            for reading in doc["glucose_readings"]:
                if "date" in reading:
                    reading["date"] = reading["date"].isoformat() if hasattr(reading["date"], "isoformat") else str(reading["date"])
        
        return doc
        
    except Exception as e:
        logger.error(f"Error getting readings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve readings: {str(e)}")

@router.delete("/bp/{reading_id}", response_model=dict)
async def delete_blood_pressure_reading(
    user_id: str = Query(..., description="User ID"),
    reading_id: str = Path(..., description="Reading ID (timestamp)")
):
    """Delete a specific blood pressure reading"""
    logger.info(f"Deleting BP reading {reading_id} for user: {user_id}")
    
    try:
        collection = get_user_readings_collection()
        
        # Convert reading_id (timestamp) to datetime for comparison
        try:
            timestamp = float(reading_id)
            target_time = datetime.fromtimestamp(timestamp)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid reading ID format")
        
        result = await collection.update_one(
            {"user_id": user_id},
            {"$pull": {"blood_pressure_readings": {"date": {"$eq": target_time}}}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Reading not found")
        
        return {
            "status": "success",
            "message": "Blood pressure reading deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting BP reading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete reading: {str(e)}")

@router.delete("/glucose/{reading_id}", response_model=dict)
async def delete_glucose_reading(
    user_id: str = Query(..., description="User ID"),
    reading_id: str = Path(..., description="Reading ID (timestamp)")
):
    """Delete a specific glucose reading"""
    logger.info(f"Deleting glucose reading {reading_id} for user: {user_id}")
    
    try:
        collection = get_user_readings_collection()
        
        # Convert reading_id (timestamp) to datetime for comparison
        try:
            timestamp = float(reading_id)
            target_time = datetime.fromtimestamp(timestamp)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid reading ID format")
        
        result = await collection.update_one(
            {"user_id": user_id},
            {"$pull": {"glucose_readings": {"date": {"$eq": target_time}}}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Reading not found")
        
        return {
            "status": "success",
            "message": "Glucose reading deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting glucose reading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete reading: {str(e)}")