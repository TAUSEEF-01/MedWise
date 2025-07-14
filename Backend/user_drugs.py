from fastapi import APIRouter, HTTPException, Body
from typing import List
from database import get_user_drug_collection
from models import Drug, UserDrugs

router = APIRouter(prefix="/user-drugs", tags=["User Drugs"])

@router.get("/all-drugs/{user_id}", response_model=List[Drug])
async def get_all_drugs(user_id: str):
    """Get all drugs for a user"""
    user_drug_collection = get_user_drug_collection()
    
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    
    if not user_drugs_doc:
        return []
    
    return user_drugs_doc.get("all_drugs", [])

@router.post("/all-drugs/{user_id}")
async def add_drugs_to_all(user_id: str, drugs: List[Drug]):
    """Add new drugs to the all_drugs list"""
    user_drug_collection = get_user_drug_collection()
    
    # Convert pydantic models to dictionaries for MongoDB
    drugs_dict = [drug.model_dump() for drug in drugs]
    
    # Check if user already has a document
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    
    if user_drugs_doc:
        # Update existing document
        await user_drug_collection.update_one(
            {"user_id": user_id},
            {"$push": {"all_drugs": {"$each": drugs_dict}}}
        )
    else:
        # Create new document
        new_user_drugs = {
            "user_id": user_id,
            "active_drugs": [],
            "all_drugs": drugs_dict
        }
        await user_drug_collection.insert_one(new_user_drugs)
    
    return {"status": "success", "message": f"Added {len(drugs)} drugs to all_drugs"}

@router.delete("/all-drugs/{user_id}")
async def delete_drug_from_all(user_id: str, drug: Drug):
    """Delete a drug from the all_drugs list and remove from active_drugs if present"""
    user_drug_collection = get_user_drug_collection()
    
    # Convert pydantic model to dictionary for MongoDB
    drug_dict = drug.model_dump()
    
    # Get user document first to find matching drugs by name and dosage
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    if not user_drugs_doc:
        raise HTTPException(status_code=404, detail="User drugs document not found")
    
    # Find drugs to delete in all_drugs based on drug_name and dosage only
    drugs_to_delete = []
    for drug_item in user_drugs_doc.get("all_drugs", []):
        if (drug_item.get("drug_name") == drug_dict["drug_name"] and
            drug_item.get("dosage") == drug_dict["dosage"]):
            drugs_to_delete.append(drug_item)
    
    if not drugs_to_delete:
        raise HTTPException(status_code=404, detail="Drug not found in all_drugs")
    
    # Delete each matching drug from all_drugs
    for drug_to_delete in drugs_to_delete:
        await user_drug_collection.update_one(
            {"user_id": user_id},
            {"$pull": {"all_drugs": drug_to_delete}}
        )
    
    # Find and remove matching drugs from active_drugs
    active_drugs_to_delete = []
    for drug_item in user_drugs_doc.get("active_drugs", []):
        if (drug_item.get("drug_name") == drug_dict["drug_name"] and
            drug_item.get("dosage") == drug_dict["dosage"]):
            active_drugs_to_delete.append(drug_item)
    
    for drug_to_delete in active_drugs_to_delete:
        await user_drug_collection.update_one(
            {"user_id": user_id},
            {"$pull": {"active_drugs": drug_to_delete}}
        )
    
    return {"status": "success", "message": f"Removed {len(drugs_to_delete)} drugs from all_drugs and {len(active_drugs_to_delete)} from active_drugs"}

@router.get("/active-drugs/{user_id}", response_model=List[Drug])
async def get_active_drugs(user_id: str):
    """Get all active drugs for a user"""
    user_drug_collection = get_user_drug_collection()
    
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    
    if not user_drugs_doc:
        return []
    
    return user_drugs_doc.get("active_drugs", [])

@router.post("/active-drugs/{user_id}")
async def add_drug_to_active(user_id: str, drug: Drug):
    """Add a drug from all_drugs to active_drugs"""
    user_drug_collection = get_user_drug_collection()
    
    # Convert pydantic model to dictionary for MongoDB
    drug_dict = drug.model_dump()
    
    # Get the user's document
    user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
    
    if not user_drugs_doc:
        raise HTTPException(status_code=404, detail="User drugs document not found")
    
    # Check if drug exists in all_drugs by name and dosage only
    drug_exists = False
    matching_all_drug = None
    for all_drug in user_drugs_doc.get("all_drugs", []):
        if (all_drug.get("drug_name") == drug_dict["drug_name"] and
            all_drug.get("dosage") == drug_dict["dosage"]):
            drug_exists = True
            matching_all_drug = all_drug  # Use the exact drug from all_drugs
            break
    
    if not drug_exists:
        raise HTTPException(status_code=404, detail="Drug not found in all_drugs")
    
    # Check if drug already exists in active_drugs by name and dosage only
    drug_active = False
    for active_drug in user_drugs_doc.get("active_drugs", []):
        if (active_drug.get("drug_name") == drug_dict["drug_name"] and
            active_drug.get("dosage") == drug_dict["dosage"]):
            drug_active = True
            break
    
    if drug_active:
        raise HTTPException(status_code=400, detail="Drug already exists in active_drugs")
    
    # Add drug to active_drugs - use the matching drug from all_drugs
    # to ensure all fields are consistent
    await user_drug_collection.update_one(
        {"user_id": user_id},
        {"$push": {"active_drugs": matching_all_drug}}
    )
    
    return {"status": "success", "message": "Drug added to active_drugs"}

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
        if (drug_item.get("drug_name") == drug_dict["drug_name"] and
            drug_item.get("dosage") == drug_dict["dosage"]):
            drugs_to_remove.append(drug_item)
    
    if not drugs_to_remove:
        raise HTTPException(status_code=404, detail="Drug not found in active_drugs")
    
    # Remove each matching drug from active_drugs
    for drug_to_remove in drugs_to_remove:
        await user_drug_collection.update_one(
            {"user_id": user_id},
            {"$pull": {"active_drugs": drug_to_remove}}
        )
    
    return {"status": "success", "message": f"Removed {len(drugs_to_remove)} drugs from active_drugs"}