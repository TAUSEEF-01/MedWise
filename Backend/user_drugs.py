from fastapi import APIRouter, HTTPException, Body, UploadFile, File
from typing import List
from gemini_service import generate_text_from_image
from database import get_user_drug_collection
from models import Drug
import logging
from bson import ObjectId

# Added imports for time endpoints
import re
from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/user-drugs", tags=["User Drugs"])


@router.get("/all-drugs/{user_id}", response_model=List[Drug])
async def get_all_drugs(user_id: str):
    """Get all drugs for a user"""
    user_drug_collection = get_user_drug_collection()

    cursor = user_drug_collection.find({"user_id": user_id})
    drugs = await cursor.to_list(length=None)

    # Convert ObjectId to string for each drug
    for drug in drugs:
        if "_id" in drug:
            drug["_id"] = str(drug["_id"])
        # Ensure 'time' field exists as list to satisfy model
        if "time" not in drug or not isinstance(drug.get("time"), list):
            drug["time"] = []

    return drugs


@router.post("/all-drugs/{user_id}")
async def add_drugs_to_all(user_id: str, drugs: List[Drug]):
    """Add new drugs"""
    user_drug_collection = get_user_drug_collection()

    # Convert pydantic models to dictionaries and add user_id
    drugs_dict = []
    for drug in drugs:
        drug_data = drug.model_dump()
        drug_data["user_id"] = user_id
        if "_id" in drug_data:
            del drug_data["_id"]  # Let MongoDB generate the ID
        drugs_dict.append(drug_data)

    # Insert drugs as individual documents
    result = await user_drug_collection.insert_many(drugs_dict)

    return {"status": "success", "message": f"Added {len(result.inserted_ids)} drugs"}


@router.delete("/all-drugs/{user_id}")
async def delete_drug_from_all(user_id: str, drug: Drug):
    """Delete a drug by drug_name and dosage"""
    user_drug_collection = get_user_drug_collection()

    # Delete drugs matching user_id, drug_name, and dosage
    result = await user_drug_collection.delete_many(
        {"user_id": user_id, "drug_name": drug.drug_name, "dosage": drug.dosage}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Drug not found")

    return {"status": "success", "message": f"Removed {result.deleted_count} drugs"}


@router.get("/active-drugs/{user_id}", response_model=List[Drug])
async def get_active_drugs(user_id: str):
    """Get all active drugs for a user"""
    user_drug_collection = get_user_drug_collection()

    cursor = user_drug_collection.find({"user_id": user_id, "isActive": True})
    active_drugs = await cursor.to_list(length=None)

    # Convert ObjectId to string for each drug
    for drug in active_drugs:
        if "_id" in drug:
            drug["_id"] = str(drug["_id"])
        if "time" not in drug or not isinstance(drug.get("time"), list):
            drug["time"] = []

    return active_drugs


@router.get("/inactive-drugs/{user_id}", response_model=List[Drug])
async def get_active_drugs(user_id: str):
    """Get all active drugs for a user"""
    user_drug_collection = get_user_drug_collection()

    cursor = user_drug_collection.find({"user_id": user_id, "isActive": False})
    active_drugs = await cursor.to_list(length=None)

    # Convert ObjectId to string for each drug
    for drug in active_drugs:
        if "_id" in drug:
            drug["_id"] = str(drug["_id"])
        if "time" not in drug or not isinstance(drug.get("time"), list):
            drug["time"] = []

    return active_drugs


@router.post("/active-drugs/{user_id}")
async def add_drug_to_active(user_id: str, drug: Drug):
    """Add a new drug and set it as active"""
    user_drug_collection = get_user_drug_collection()

    # Convert pydantic model to dictionary
    drug_dict = drug.model_dump(
        exclude={"id"}
    )  # Exclude id field, let MongoDB generate _id
    drug_dict["user_id"] = user_id
    drug_dict["isActive"] = True

    # Check if drug already exists
    existing_drug = await user_drug_collection.find_one(
        {"user_id": user_id, "drug_name": drug.drug_name, "dosage": drug.dosage}
    )

    if existing_drug:
        raise HTTPException(status_code=400, detail="Drug already exists")

    # Insert new drug
    result = await user_drug_collection.insert_one(drug_dict)

    return {
        "status": "success",
        "message": "Drug added as active",
        "drug_id": str(result.inserted_id),
    }


@router.delete("/active-drugs/{user_id}")
async def remove_drug_from_active(user_id: str, drug: Drug):
    """Set drug as inactive (keeps it in database)"""
    user_drug_collection = get_user_drug_collection()

    # Update drugs to set isActive to False
    result = await user_drug_collection.update_many(
        {
            "user_id": user_id,
            "drug_name": drug.drug_name,
            "dosage": drug.dosage,
            "isActive": True,
        },
        {"$set": {"isActive": False}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Active drug not found")

    return {
        "status": "success",
        "message": f"Deactivated {result.modified_count} drugs",
    }


@router.patch("/change-drug-active-status/{user_id}")
async def update_drug_active_status(user_id: str, drug_id: str, is_active: bool):
    """Update the isActive status of a drug for a user"""
    user_drug_collection = get_user_drug_collection()

    try:
        object_id = ObjectId(drug_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid drug ID format")

    result = await user_drug_collection.update_one(
        {"_id": object_id, "user_id": user_id}, {"$set": {"isActive": is_active}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Drug not found")

    return {
        "status": "success",
        "message": f"Drug active status updated to {is_active}",
    }


@router.delete("/active-drugs/{user_id}")
async def remove_drug_from_active(user_id: str, drug: Drug):
    """Remove a drug from active_drugs (keeps it in all_drugs)"""
    user_drug_collection = get_user_drug_collection()

    # Convert pydantic model to dictionary for MongoDB
    drug_dict = drug.model_dump()

    # Get user document first to find matching drugs by name and dosage
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    if not user_drugs_doc:
        raise HTTPException(status_code=404, detail="User drugs document not found")

    # Find drugs to remove from active_drugs based on drug_name and dosage only
    drugs_to_remove = []
    for drug_item in user_drugs_doc.get("active_drugs", []):
        if (
            drug_item.get("drug_name") == drug_dict["drug_name"]
            and drug_item.get("dosage") == drug_dict["dosage"]
        ):
            drugs_to_remove.append(drug_item)

    if not drugs_to_remove:
        raise HTTPException(status_code=404, detail="Drug not found in active_drugs")

    # Remove each matching drug from active_drugs
    for drug_to_remove in drugs_to_remove:
        await user_drug_collection.update_one(
            {"user_id": user_id}, {"$pull": {"active_drugs": drug_to_remove}}
        )

    return {
        "status": "success",
        "message": f"Removed {len(drugs_to_remove)} drugs from active_drugs",
    }


@router.post("/upload-image/{user_id}")
async def upload_image_for_user(user_id: str, file: UploadFile = File(...)):
    """
    Uploads an image for a specific user, generates text from it using the Gemini API,
    and returns the generated text.
    """
    logger.info("=== GEMINI UPLOAD ENDPOINT CALLED ===")
    logger.info(f"Received file: {file.filename}")
    logger.info(f"Content type: {file.content_type}")
    logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    logger.info(f"User ID: {user_id}")

    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        result = await generate_text_from_image(file, user_id)
        logger.info("Successfully processed file upload")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in upload_image_for_user endpoint: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ===================== NEW TIME MANAGEMENT ENDPOINTS =====================
TIME_PATTERN = re.compile(r"^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$")


class TimesPayload(BaseModel):
    times: List[str]


def _validate_times(times: List[str]):
    if not isinstance(times, list) or len(times) == 0:
        raise HTTPException(status_code=400, detail="Times list cannot be empty")
    invalid = [t for t in times if not TIME_PATTERN.match(t)]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid time format(s): {invalid}. Expected HH:MM AM/PM",
        )


async def _get_drug_doc(user_id: str, drug_id: str):
    try:
        oid = ObjectId(drug_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid drug ID format")
    collection = get_user_drug_collection()
    drug = await collection.find_one({"_id": oid, "user_id": user_id})
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug, collection, oid


@router.get("/drug-times/{user_id}/{drug_id}")
async def get_drug_times(user_id: str, drug_id: str):
    """Return the list of time strings for a specific drug."""
    drug, *_ = await _get_drug_doc(user_id, drug_id)
    return {"status": "success", "times": drug.get("time", [])}


@router.patch("/drug-times/{user_id}/{drug_id}")
async def replace_drug_times(user_id: str, drug_id: str, payload: TimesPayload):
    """Replace the entire time array for a drug."""
    _validate_times(payload.times)
    drug, collection, oid = await _get_drug_doc(user_id, drug_id)
    # Only update if different
    if sorted(payload.times) == sorted(drug.get("time", [])):
        return {"status": "success", "message": "No change", "times": payload.times}
    await collection.update_one({"_id": oid}, {"$set": {"time": payload.times}})
    return {"status": "success", "message": "Times replaced", "times": payload.times}


@router.post("/drug-times/{user_id}/{drug_id}")
async def add_drug_times(user_id: str, drug_id: str, payload: TimesPayload):
    """Add one or more new time strings (ignores duplicates)."""
    _validate_times(payload.times)
    drug, collection, oid = await _get_drug_doc(user_id, drug_id)
    existing_times = set(drug.get("time", []))
    new_times = [t for t in payload.times if t not in existing_times]
    if not new_times:
        return {
            "status": "success",
            "message": "All times already present",
            "times": list(existing_times),
        }
    updated_times = list(existing_times.union(new_times))
    await collection.update_one({"_id": oid}, {"$set": {"time": updated_times}})
    return {
        "status": "success",
        "message": f"Added {len(new_times)} time(s)",
        "times": updated_times,
    }


@router.delete("/drug-times/{user_id}/{drug_id}")
async def delete_drug_times(user_id: str, drug_id: str, payload: TimesPayload):
    """Delete specified time strings from a drug."""
    if not payload.times:
        raise HTTPException(status_code=400, detail="Times list cannot be empty")
    drug, collection, oid = await _get_drug_doc(user_id, drug_id)
    current_times = set(drug.get("time", []))
    to_remove = set(payload.times)
    intersection = current_times.intersection(to_remove)
    if not intersection:
        raise HTTPException(
            status_code=404,
            detail="None of the specified times exist on this drug",
        )
    remaining = list(current_times - intersection)
    await collection.update_one({"_id": oid}, {"$set": {"time": remaining}})
    return {
        "status": "success",
        "message": f"Removed {len(intersection)} time(s)",
        "times": remaining,
    }


# =================== END TIME MANAGEMENT ENDPOINTS =======================
