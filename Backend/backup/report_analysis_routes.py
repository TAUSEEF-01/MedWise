# from fastapi import APIRouter, HTTPException
# from typing import List
# from bson import ObjectId
# from database import db

# router = APIRouter(
#     prefix="/report-analysis-responses", tags=["Report Analysis Responses"]
# )


# def get_collection():
#     if db is None:
#         raise HTTPException(status_code=500, detail="Database not connected")
#     return db.report_analysis_responses


# def serialize(item):
#     item["_id"] = str(item["_id"])
#     return item


# @router.get("/", response_model=List[dict])
# async def get_all():
#     collection = get_collection()
#     items = await collection.find().to_list(1000)
#     return [serialize(i) for i in items]


# @router.get("/{item_id}", response_model=dict)
# async def get_one(item_id: str):
#     collection = get_collection()
#     item = await collection.find_one({"_id": ObjectId(item_id)})
#     if not item:
#         raise HTTPException(status_code=404, detail="Not found")
#     return serialize(item)


# @router.post("/", response_model=dict)
# async def create(item: dict):
#     collection = get_collection()
#     result = await collection.insert_one(item)
#     created = await collection.find_one({"_id": result.inserted_id})
#     return serialize(created)


# @router.delete("/{item_id}")
# async def delete(item_id: str):
#     collection = get_collection()
#     result = await collection.delete_one({"_id": ObjectId(item_id)})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Not found")
#     return {"message": "Deleted"}
