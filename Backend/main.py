from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from gemini_routes import router as gemini_router
from image_routes import router as image_router

import sys

print("PYTHON EXECUTABLE:", sys.executable)
try:
    import google.generativeai

    print("google.generativeai import SUCCESS")
except Exception as e:
    print("google.generativeai import FAIL:", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="HealthPilot Backend API",
    description="Backend API for HealthPilot application with image processing",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes (removed auth router since we're not using authentication)
app.include_router(gemini_router)
app.include_router(image_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to HealthPilot Backend API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "HealthPilot Backend is running successfully",
    }
