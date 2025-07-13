from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from database import db  # Assumes db is exposed from database.py


class BasicInfo(BaseModel):
    title: str
    type: str
    description: str


class HealthcareInfo(BaseModel):
    doctorName: str
    hospitalName: str


class VitalSigns(BaseModel):
    bloodPressure: str
    heartRate: str
    GlucoseLevel: str
    weight: str


class AdditionalInfo(BaseModel):
    medications: str
    diagnosis: str


class LabReport(BaseModel):
    basicInfo: BasicInfo
    healthcareInfo: HealthcareInfo
    vitalSigns: VitalSigns
    additionalInfo: AdditionalInfo


class LabReportOut(LabReport):
    id: str = Field(default_factory=str, alias="_id")


router = APIRouter(prefix="/lab-reports", tags=["Lab Reports"])


def get_lab_reports_collection():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    return db.lab_reports


def serialize_lab_report(report):
    report["_id"] = str(report["_id"])
    return report


@router.post("/", response_model=LabReportOut)
async def create_lab_report(report: LabReport):
    collection = get_lab_reports_collection()
    result = await collection.insert_one(report.dict())
    created = await collection.find_one({"_id": result.inserted_id})
    return serialize_lab_report(created)


@router.get("/", response_model=List[LabReportOut])
async def get_lab_reports():
    collection = get_lab_reports_collection()
    reports = await collection.find().to_list(1000)
    return [serialize_lab_report(r) for r in reports]


@router.get("/{report_id}", response_model=LabReportOut)
async def get_lab_report(report_id: str):
    collection = get_lab_reports_collection()
    report = await collection.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return serialize_lab_report(report)


@router.put("/{report_id}", response_model=LabReportOut)
async def update_lab_report(report_id: str, report: LabReport):
    collection = get_lab_reports_collection()
    result = await collection.update_one(
        {"_id": ObjectId(report_id)}, {"$set": report.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lab report not found")
    updated = await collection.find_one({"_id": ObjectId(report_id)})
    return serialize_lab_report(updated)


@router.delete("/{report_id}")
async def delete_lab_report(report_id: str):
    collection = get_lab_reports_collection()
    result = await collection.delete_one({"_id": ObjectId(report_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return {"message": "Lab report deleted"}


@router.get("/count")
async def get_lab_report_count():
    collection = get_lab_reports_collection()
    count = await collection.count_documents({})
    return {"count": count}
