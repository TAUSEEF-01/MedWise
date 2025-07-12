from fastapi import UploadFile, HTTPException
import os
import uuid
import logging
from datetime import datetime
import io
import json
import re
import google.generativeai as genai
from config import GOOGLE_AI_API_KEY
from database import get_image_collection, get_gemini_response_collection
import random
import string

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure the Gemini API client
genai.configure(api_key=GOOGLE_AI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

json_formate = """{"
  "report_type": "prescription",
  "date": "19/05/2024",
  "visit_no": "2",

  "doctor": {
    "name": "Dr Mohammad Anisur Rahman"
  },

  "patient": {
    "name": "Mr Fahim",
    "age": "22",
    "sex": "M",
    "weight": "78"
  },

  "allergies": [
    "Penicillin",
    "Dust mites"
  ],

  "past_medical_history": [
    "Appendectomy (2018)",
    "Hypertension"
  ],

  "lab_results": {
    "CBC": {
      "WBC": "6.2 x10^3/µL",
      "Hb": "13.5 g/dL",
      "Platelets": "250 x10^3/µL"
    },
    "CRP": "4 mg/L"
  },

  "diagnosis": "A PLID, L-5-S1 with canal stenosis",

  "complaints": [
    "LBP RRLL",
    "NO COMORBIDITY",
    "H/O Blunt trauma"
  ],

  "examination": {
    "BP": "120/70 mmHg",
    "Pulse": "78 b/min",
    "SLR": "RT-40, Lt-20",
    "FABER": "-",
    "FAIR": "-",
    "Axial Tenderness": "LS-S1"
  },

  "plan": [
    "Fluroscopic Intervention 30",
    "SURGERY"
  ],

  "prescriptions": [
    {
      "drug_name": "TAB MIRALIN 5MG",
      "dosage": "1+0+1", 
      "instructions": "After food",
      "duration": "8 months"
    },
    
  ],

  "advice": [
    "Use high commode.",
    "Sleep on a firm bed.",
    "Apply cold compress for 20 minutes in the morning and evening for the next 3 days, then apply warm compress."
  ],

  "next_appointment": "1 month later",

  "contact": {
    "phone_numbers": [
      "01799942792",
    ],
    "address": "House # 35. Road #17, Flat # 3/A (opposite banani kachabazar), Banani, Dhaka"
  },
}
"""


def extract_json_from_text(text):
    """
    Extract JSON from text that might contain markdown or other content
    """
    # Try to find JSON content between triple backticks
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if json_match:
        json_str = json_match.group(1).strip()
    else:
        # If no markdown code block found, use the whole text
        json_str = text.strip()

    # Clean up any remaining markdown or text artifacts
    json_str = re.sub(r"^[^{]*", "", json_str)  # Remove anything before first '{'
    json_str = re.sub(r"[^}]*$", "", json_str)  # Remove anything after last '}'

    print(
        "Extracted JSON string:",
        json_str[:100] + "..." if len(json_str) > 100 else json_str,
    )
    return json_str


def random_id(length=24):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


async def generate_text_from_image(file: UploadFile):
    """
    Generates text from an uploaded image file using the Gemini API.
    No authentication required.
    """
    temp_file_path = None
    logger.info(f"=== GEMINI API ANALYSIS STARTED ===")
    logger.info(f"File: {file.filename}")
    logger.info(f"Content type: {file.content_type}")

    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only images are allowed.",
            )

        # Read the image file
        logger.info("Reading image file...")
        contents = await file.read()
        logger.info(f"Image file read successfully, size: {len(contents)} bytes")

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")

        # Create a temporary file with unique name
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        temp_file_name = f"{uuid.uuid4()}{file_extension}"
        temp_file_path = os.path.join("uploads", temp_file_name)

        # Ensure uploads directory exists
        os.makedirs("uploads", exist_ok=True)
        logger.info(f"Saving temporary file: {temp_file_path}")

        # Save the uploaded file temporarily
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        logger.info(f"Temporary file saved successfully: {temp_file_path}")

        # Upload the temporary file to Gemini
        logger.info(f"Uploading file to Gemini API: {temp_file_path}")
        img = genai.upload_file(temp_file_path)
        logger.info(f"File uploaded to Gemini API successfully")

        response = model.generate_content(
            [
                img,
                f"extract it to json format strictly. only english, translate to english if there are any other language. dosage should be x+x+x formate. if you cant translate keep blank. JSON formate: {json_formate}",
            ],
        )

        logger.info("Gemini API response received")
        logger.debug(f"Raw Gemini API Response: {response.text}")

        # Create the consistent response envelope
        response_envelope = {
            "success": False,
            "data": None,
            "raw_text": response.text,
            "error": None,
            "processed_at": datetime.utcnow().isoformat(),
            "imageId": None,
            "userId": None,
        }

        # Try to parse the response text as JSON
        try:
            # First try direct JSON parsing
            try:
                parsed_json = json.loads(response.text)
                logger.info("Successfully parsed direct JSON from Gemini response")
                response_envelope["success"] = True
                response_envelope["data"] = parsed_json

            except json.JSONDecodeError:
                # If that fails, try to extract JSON from text
                logger.info(
                    "Direct JSON parsing failed, attempting to extract JSON from text"
                )
                json_str = extract_json_from_text(response.text)
                parsed_json = json.loads(json_str)
                logger.info("Successfully parsed extracted JSON from Gemini response")
                response_envelope["success"] = True
                response_envelope["data"] = parsed_json

        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parsing error: {json_error}")
            response_envelope["error"] = f"JSON parsing error: {str(json_error)}"

        # Generate IDs for database storage
        image_id = random_id()
        user_id = random_id()

        response_envelope["imageId"] = image_id
        response_envelope["userId"] = user_id

        # Insert image processing result into database
        image_doc = {
            "image_id": image_id,
            "user_id": user_id,
            "original_filename": file.filename,
            "file_path": temp_file_path,
            "uploaded_at": datetime.utcnow(),
            "status": "completed" if response_envelope["success"] else "failed",
            "analysis_result": (
                response_envelope["data"] if response_envelope["success"] else None
            ),
            "error_message": response_envelope["error"],
            "completed_at": datetime.utcnow(),
        }

        logger.info(f"Saving to database - image_doc: {image_doc}")

        image_collection = get_image_collection()
        await image_collection.insert_one(image_doc)

        # Store Gemini API response in gemini_responses collection
        if response_envelope["success"]:
            gemini_response_doc = {
                "user_id": user_id,
                "image_id": image_id,
                "data": response_envelope["data"],
                "created_at": datetime.utcnow(),
            }

            logger.info(
                f"Saving gemini response - gemini_response_doc: {gemini_response_doc}"
            )

            gemini_response_collection = get_gemini_response_collection()
            await gemini_response_collection.insert_one(gemini_response_doc)

        logger.info("=== GEMINI API ANALYSIS COMPLETED SUCCESSFULLY ===")
        return response_envelope

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_text_from_image: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    finally:
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Temporary file {temp_file_path} removed")
            except Exception as cleanup_error:
                logger.warning(
                    f"Failed to remove temporary file {temp_file_path}: {cleanup_error}"
                )
