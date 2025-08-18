from fastapi import APIRouter, HTTPException, Body, UploadFile, File
from typing import List
from gemini_service import generate_text_from_image
from database import get_user_drug_collection
from models import Drug
import logging
from bson import ObjectId

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


# @router.post("/upload-image/{user_id}")
# async def upload_image_for_user(user_id: str, file: UploadFile = File(...)):
#     """
#     Uploads an image for a specific user, generates text from it using the Gemini API,
#     and returns the generated text.
#     """
#     logger.info("=== GEMINI UPLOAD ENDPOINT CALLED ===")
#     logger.info(f"Received file: {file.filename}")
#     logger.info(f"Content type: {file.content_type}")
#     logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
#     logger.info(f"User ID: {user_id}")

#     try:
#         if not file:
#             raise HTTPException(status_code=400, detail="No file provided")

#         # You may want to pass user_id to your processing function if needed
#         result = await generate_text_from_image(file, user_id)
#         logger.info("Successfully processed file upload")
#         return result

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(
#             f"Unexpected error in upload_image_for_user endpoint: {str(e)}",
#             exc_info=True,
#         )
#         raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# @router.patch("/change-drug-active-status/{user_id}")
# async def update_drug_active_status(user_id: str, drug_id: str, is_active: bool):
#     """Update the isActive status of a drug for a user"""
#     user_drug_collection = get_user_drug_collection()

#     # Get user document
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Update in all_drugs
#     updated_all = await user_drug_collection.update_one(
#         {"user_id": user_id, "all_drugs._id": drug_id},
#         {"$set": {"all_drugs.$.isActive": is_active}},
#     )

#     # Update in active_drugs
#     updated_active = await user_drug_collection.update_one(
#         {"user_id": user_id, "active_drugs._id": drug_id},
#         {"$set": {"active_drugs.$.isActive": is_active}},
#     )

#     if updated_all.modified_count == 0 and updated_active.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Drug not found")

#     return {
#         "status": "success",
#         "message": f"Drug active status updated to {is_active}",
#     }


# @router.post("/upload-image/{user_id}")
# async def upload_image_for_user(user_id: str, file: UploadFile = File(...)):
#     """
#     Uploads an image for a specific user, generates text from it using the Gemini API,
#     and returns the generated text.
#     """
#     logger.info("=== GEMINI UPLOAD ENDPOINT CALLED ===")
#     logger.info(f"Received file: {file.filename}")
#     logger.info(f"Content type: {file.content_type}")
#     logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
#     logger.info(f"User ID: {user_id}")

#     try:
#         if not file:
#             raise HTTPException(status_code=400, detail="No file provided")

#         # You may want to pass user_id to your processing function if needed
#         result = await generate_text_from_image(file, user_id)
#         logger.info("Successfully processed file upload")
#         return result

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(
#             f"Unexpected error in upload_image_for_user endpoint: {str(e)}",
#             exc_info=True,
#         )
#         raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# @router.patch("/change-drug-active-status/{user_id}")
# async def update_drug_active_status(user_id: str, drug_id: str, is_active: bool):
#     """Update the isActive status of a drug for a user"""
#     user_drug_collection = get_user_drug_collection()

#     # Get user document
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Update in all_drugs
#     updated_all = await user_drug_collection.update_one(
#         {"user_id": user_id, "all_drugs._id": drug_id},
#         {"$set": {"all_drugs.$.isActive": is_active}},
#     )

#     # Update in active_drugs
#     updated_active = await user_drug_collection.update_one(
#         {"user_id": user_id, "active_drugs._id": drug_id},
#         {"$set": {"active_drugs.$.isActive": is_active}},
#     )

#     if updated_all.modified_count == 0 and updated_active.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Drug not found")

#     return {
#         "status": "success",
#         "message": f"Drug active status updated to {is_active}",
#     }


# from fastapi import APIRouter, HTTPException, Body, UploadFile, File
# from typing import List
# from gemini_service import generate_text_from_image
# from database import get_user_drug_collection
# from models import Drug, UserDrugs
# import logging

# logger = logging.getLogger("uvicorn.error")

# router = APIRouter(prefix="/user-drugs", tags=["User Drugs"])


# @router.get("/all-drugs/{user_id}", response_model=List[Drug])
# async def get_all_drugs(user_id: str):
#     """Get all drugs for a user"""
#     user_drug_collection = get_user_drug_collection()

#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})

#     if not user_drugs_doc:
#         return []

#     return user_drugs_doc.get("all_drugs", [])


# @router.post("/all-drugs/{user_id}")
# async def add_drugs_to_all(user_id: str, drugs: List[Drug]):
#     """Add new drugs to the all_drugs list"""
#     user_drug_collection = get_user_drug_collection()

#     # Convert pydantic models to dictionaries for MongoDB
#     drugs_dict = [drug.model_dump() for drug in drugs]

#     # Check if user already has a document
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})

#     if user_drugs_doc:
#         # Update existing document
#         await user_drug_collection.update_one(
#             {"user_id": user_id}, {"$push": {"all_drugs": {"$each": drugs_dict}}}
#         )
#     else:
#         # Create new document
#         new_user_drugs = {
#             "user_id": user_id,
#             "active_drugs": [],
#             "all_drugs": drugs_dict,
#         }
#         await user_drug_collection.insert_one(new_user_drugs)

#     return {"status": "success", "message": f"Added {len(drugs)} drugs to all_drugs"}


# @router.delete("/all-drugs/{user_id}")
# async def delete_drug_from_all(user_id: str, drug: Drug):
#     """Delete a drug from the all_drugs list and remove from active_drugs if present"""
#     user_drug_collection = get_user_drug_collection()

#     # Convert pydantic model to dictionary for MongoDB
#     drug_dict = drug.model_dump()

#     # Get user document first to find matching drugs by name and dosage
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Find drugs to delete in all_drugs based on drug_name and dosage only
#     drugs_to_delete = []
#     for drug_item in user_drugs_doc.get("all_drugs", []):
#         if (
#             drug_item.get("drug_name") == drug_dict["drug_name"]
#             and drug_item.get("dosage") == drug_dict["dosage"]
#         ):
#             drugs_to_delete.append(drug_item)

#     if not drugs_to_delete:
#         raise HTTPException(status_code=404, detail="Drug not found in all_drugs")

#     # Delete each matching drug from all_drugs
#     for drug_to_delete in drugs_to_delete:
#         await user_drug_collection.update_one(
#             {"user_id": user_id}, {"$pull": {"all_drugs": drug_to_delete}}
#         )

#     # Find and remove matching drugs from active_drugs
#     active_drugs_to_delete = []
#     for drug_item in user_drugs_doc.get("active_drugs", []):
#         if (
#             drug_item.get("drug_name") == drug_dict["drug_name"]
#             and drug_item.get("dosage") == drug_dict["dosage"]
#         ):
#             active_drugs_to_delete.append(drug_item)

#     for drug_to_delete in active_drugs_to_delete:
#         await user_drug_collection.update_one(
#             {"user_id": user_id}, {"$pull": {"active_drugs": drug_to_delete}}
#         )

#     return {
#         "status": "success",
#         "message": f"Removed {len(drugs_to_delete)} drugs from all_drugs and {len(active_drugs_to_delete)} from active_drugs",
#     }


# # @router.get("/active-drugs/{user_id}", response_model=List[Drug])
# # async def get_active_drugs(user_id: str):
# #     """Get all active drugs for a user"""
# #     user_drug_collection = get_user_drug_collection()

# #     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})

# #     if not user_drugs_doc:
# #         return []

# #     return user_drugs_doc.get("active_drugs", [])


# @router.get("/active-drugs/{user_id}", response_model=List[Drug])
# async def get_active_drugs(user_id: str):
#     """Get all active drugs for a user"""
#     user_drug_collection = get_user_drug_collection()

#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})

#     if not user_drugs_doc:
#         return []

#     # Filter drugs where isActive is True
#     active_drugs = [
#         drug
#         for drug in user_drugs_doc.get("active_drugs", [])
#         if drug.get("isActive", True) is True
#     ]

#     return active_drugs


# @router.post("/active-drugs/{user_id}")
# async def add_drug_to_active(user_id: str, drug: Drug):
#     """Add a drug from all_drugs to active_drugs"""
#     user_drug_collection = get_user_drug_collection()

#     # Convert pydantic model to dictionary for MongoDB
#     drug_dict = drug.model_dump()

#     # Get the user's document
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})

#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Check if drug exists in all_drugs by name and dosage only
#     drug_exists = False
#     matching_all_drug = None
#     for all_drug in user_drugs_doc.get("all_drugs", []):
#         if (
#             all_drug.get("drug_name") == drug_dict["drug_name"]
#             and all_drug.get("dosage") == drug_dict["dosage"]
#         ):
#             drug_exists = True
#             matching_all_drug = all_drug  # Use the exact drug from all_drugs
#             break

#     if not drug_exists:
#         raise HTTPException(status_code=404, detail="Drug not found in all_drugs")

#     # Check if drug already exists in active_drugs by name and dosage only
#     drug_active = False
#     for active_drug in user_drugs_doc.get("active_drugs", []):
#         if (
#             active_drug.get("drug_name") == drug_dict["drug_name"]
#             and active_drug.get("dosage") == drug_dict["dosage"]
#         ):
#             drug_active = True
#             break

#     if drug_active:
#         raise HTTPException(
#             status_code=400, detail="Drug already exists in active_drugs"
#         )

#     # Add drug to active_drugs - use the matching drug from all_drugs
#     # to ensure all fields are consistent
#     await user_drug_collection.update_one(
#         {"user_id": user_id}, {"$push": {"active_drugs": matching_all_drug}}
#     )

#     return {"status": "success", "message": "Drug added to active_drugs"}


# @router.delete("/active-drugs/{user_id}")
# async def remove_drug_from_active(user_id: str, drug: Drug):
#     """Remove a drug from active_drugs (keeps it in all_drugs)"""
#     user_drug_collection = get_user_drug_collection()

#     # Convert pydantic model to dictionary for MongoDB
#     drug_dict = drug.model_dump()

#     # Get user document first to find matching drugs by name and dosage
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Find drugs to remove from active_drugs based on drug_name and dosage only
#     drugs_to_remove = []
#     for drug_item in user_drugs_doc.get("active_drugs", []):
#         if (
#             drug_item.get("drug_name") == drug_dict["drug_name"]
#             and drug_item.get("dosage") == drug_dict["dosage"]
#         ):
#             drugs_to_remove.append(drug_item)

#     if not drugs_to_remove:
#         raise HTTPException(status_code=404, detail="Drug not found in active_drugs")

#     # Remove each matching drug from active_drugs
#     for drug_to_remove in drugs_to_remove:
#         await user_drug_collection.update_one(
#             {"user_id": user_id}, {"$pull": {"active_drugs": drug_to_remove}}
#         )

#     return {
#         "status": "success",
#         "message": f"Removed {len(drugs_to_remove)} drugs from active_drugs",
#     }


# @router.post("/upload-image/{user_id}")
# async def upload_image_for_user(user_id: str, file: UploadFile = File(...)):
#     """
#     Uploads an image for a specific user, generates text from it using the Gemini API,
#     and returns the generated text.
#     """
#     logger.info("=== GEMINI UPLOAD ENDPOINT CALLED ===")
#     logger.info(f"Received file: {file.filename}")
#     logger.info(f"Content type: {file.content_type}")
#     logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
#     logger.info(f"User ID: {user_id}")

#     try:
#         if not file:
#             raise HTTPException(status_code=400, detail="No file provided")

#         # You may want to pass user_id to your processing function if needed
#         result = await generate_text_from_image(file, user_id)
#         logger.info("Successfully processed file upload")
#         return result

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(
#             f"Unexpected error in upload_image_for_user endpoint: {str(e)}",
#             exc_info=True,
#         )
#         raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# @router.patch("/change-drug-active-status/{user_id}")
# async def update_drug_active_status(user_id: str, drug_id: str, is_active: bool):
#     """Update the isActive status of a drug for a user"""
#     user_drug_collection = get_user_drug_collection()

#     # Get user document
#     user_drugs_doc = await user_drug_collection.find_one({"user_id": user_id})
#     if not user_drugs_doc:
#         raise HTTPException(status_code=404, detail="User drugs document not found")

#     # Update in all_drugs
#     updated_all = await user_drug_collection.update_one(
#         {"user_id": user_id, "all_drugs._id": drug_id},
#         {"$set": {"all_drugs.$.isActive": is_active}},
#     )

#     # Update in active_drugs
#     updated_active = await user_drug_collection.update_one(
#         {"user_id": user_id, "active_drugs._id": drug_id},
#         {"$set": {"active_drugs.$.isActive": is_active}},
#     )

#     if updated_all.modified_count == 0 and updated_active.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Drug not found")

#     return {
#         "status": "success",
#         "message": f"Drug active status updated to {is_active}",
#     }
