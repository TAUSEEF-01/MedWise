from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from gemini_routes import router as gemini_router
from image_routes import router as image_router

from readings_route import router as readings_route

from auth_routes import router as auth_router


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
