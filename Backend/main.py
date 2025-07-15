from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from gemini_routes import router as gemini_router
from image_routes import router as image_router

from readings_route import router as readings_route

from auth_routes import router as auth_router

from lab_reports_routes import router as lab_reports_router
from report_analysis_routes import router as report_analysis_router
from user_drugs import router as user_drugs_router

import sys
import logging

print("PYTHON EXECUTABLE:", sys.executable)
try:
    import google.generativeai

    print("google.generativeai import SUCCESS")
except Exception as e:
    print("google.generativeai import FAIL:", e)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="medwise Backend API",
    description="Backend API for medwise application with image processing",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware with proper credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,  # This is important for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth_router)
app.include_router(gemini_router)
app.include_router(image_router)
app.include_router(readings_route)
app.include_router(lab_reports_router)
app.include_router(report_analysis_router)
app.include_router(user_drugs_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to medwise Backend API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "medwise Backend is running successfully",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
