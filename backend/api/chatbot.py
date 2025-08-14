import os
import uuid
import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import tempfile
import shutil
import re

# Add the ChatBot directory to the path so we can import its modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ChatBot'))

# Import ChatBot modules (these are the existing functions we'll wrap)
from ocr_parser import extract_and_parse, extract_text_only
from retriever import KnowledgeBaseRetriever
from gemini_llm import generate_diet_plan_with_gemini
from knowledge_base import process_pdf_to_faiss
from batch_ingest import batch_ingest

def is_diet_related_question(message: str) -> bool:
    """Check if the question is related to diet, diabetes, or blood pressure."""
    keywords = [
        'diet', 'food', 'meal', 'eat', 'nutrition', 'sugar', 'glucose', 'carb', 'protein',
        'diabetes', 'diabetic', 'blood sugar', 'insulin', 'a1c', 'glycemic',
        'blood pressure', 'hypertension', 'sodium', 'salt', 'dash diet',
        'breakfast', 'lunch', 'dinner', 'snack', 'portion', 'weight', 'bmi',
        'cholesterol', 'fat', 'calorie', 'exercise', 'lifestyle', 'management',
        'plan', 'diet plan', 'days', 'week', 'month'
    ]
    message = message.lower()
    return any(keyword in message for keyword in keywords)

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

# Configuration
MAX_UPLOAD_SIZE_MB = 25
ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
CHATBOT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'ChatBot', 'data')

# Ensure required directories exist
os.makedirs(os.path.join(CHATBOT_DATA_DIR, 'uploads'), exist_ok=True)
os.makedirs(os.path.join(CHATBOT_DATA_DIR, 'sessions'), exist_ok=True)

# Pydantic models
class PatientInfo(BaseModel):
    condition: str  # "diabetes" or "hypertension" or "both"
    diabetes_type: Optional[str] = None  # "type1" or "type2" or None
    diabetes_level: Optional[str] = None  # "controlled", "uncontrolled", None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None

class ChatMessage(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = []
    patient_info: Optional[PatientInfo] = None
    settings: Optional[Dict[str, Any]] = {}

class DietPlanRequest(BaseModel):
    duration: str  # "1_week", "10_days", "14_days", "21_days", "1_month"
    preferences: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    message_id: str
    response: str
    sources: List[Dict[str, Any]]
    meta: Dict[str, Any]

class IngestStatus(BaseModel):
    session_id: str
    status: str  # queued, in_progress, completed, failed
    detail: Optional[str] = None
    percent: Optional[int] = None

# Session management
sessions: Dict[str, Dict[str, Any]] = {}
ingest_tasks: Dict[str, Dict[str, Any]] = {}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:100-len(ext)] + ext
    return filename

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False
    if file.size and file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return False
    return True

def extract_medical_data_from_files(session_id: str) -> Dict[str, Any]:
    """Extract relevant medical data from uploaded files using OCR parser"""
    medical_data = {
        "diabetes_info": {
            "diagnosis": "No",
            "glucose_levels": "No",
            "hba1c": "No"
        },
        "blood_pressure_info": {
            "readings": "No",
            "systolic": "No",
            "diastolic": "No"
        },
        "lab_results": {
            "has_lab_data": "No",
            "cholesterol": "No",
            "kidney_function": "No"
        },
        "medications": [],
        "allergies": [],
        "extracted_text": ""
    }
    
    session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
    if not os.path.exists(session_dir):
        return medical_data
    
    try:
        # Process each file in the session directory
        for filename in os.listdir(session_dir):
            if filename.endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                file_path = os.path.join(session_dir, filename)
                
                # Extract text using OCR parser
                try:
                    # Use extract_text_only for raw text extraction
                    extracted_text = extract_text_only(file_path)
                    medical_data["extracted_text"] += f"\n--- {filename} ---\n{extracted_text}"
                    
                    # Use extract_and_parse for structured medical data
                    ocr_data = extract_and_parse(file_path)
                    
                    # Look for specific medical information
                    text_lower = extracted_text.lower()
                    
                    # Diabetes-related information
                    if any(keyword in text_lower for keyword in ['diabetes', 'diabetic', 'glucose', 'sugar', 'hba1c', 'fbs']):
                        if 'diabetes' in text_lower or 'diabetic' in text_lower:
                            medical_data["diabetes_info"]["diagnosis"] = "Yes - Diabetes detected"
                        if 'glucose' in text_lower or 'sugar' in text_lower:
                            # Extract glucose values
                            glucose_matches = re.findall(r'glucose[:\s]*(\d+(?:\.\d+)?)', text_lower)
                            if glucose_matches:
                                medical_data["diabetes_info"]["glucose_levels"] = f"Yes - {', '.join(glucose_matches)} mg/dL"
                        
                        # Extract HbA1c values
                        hba1c_matches = re.findall(r'hba1c[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if hba1c_matches:
                            medical_data["diabetes_info"]["hba1c"] = f"Yes - {', '.join(hba1c_matches)}%"
                    
                    # Blood pressure information
                    if any(keyword in text_lower for keyword in ['blood pressure', 'bp', 'systolic', 'diastolic']):
                        bp_matches = re.findall(r'(\d+)/(\d+)', text_lower)
                        if bp_matches:
                            bp_readings = [f"{systolic}/{diastolic}" for systolic, diastolic in bp_matches]
                            medical_data["blood_pressure_info"]["readings"] = f"Yes - {', '.join(bp_readings)} mmHg"
                            medical_data["blood_pressure_info"]["systolic"] = f"Yes - {bp_matches[0][0]} mmHg"
                            medical_data["blood_pressure_info"]["diastolic"] = f"Yes - {bp_matches[0][1]} mmHg"
                    
                    # Lab results
                    if any(keyword in text_lower for keyword in ['lab', 'test', 'result', 'report']):
                        medical_data["lab_results"]["has_lab_data"] = "Yes - Lab data detected"
                    
                    # Cholesterol levels
                    if any(keyword in text_lower for keyword in ['cholesterol', 'hdl', 'ldl', 'triglycerides']):
                        medical_data["lab_results"]["cholesterol"] = "Yes - Cholesterol data detected"
                    
                    # Kidney function
                    if any(keyword in text_lower for keyword in ['creatinine', 'egfr', 'kidney', 'renal']):
                        medical_data["lab_results"]["kidney_function"] = "Yes - Kidney function data detected"
                    
                    # Medications
                    if any(keyword in text_lower for keyword in ['medication', 'prescription', 'drug', 'tablet', 'metformin', 'insulin']):
                        medical_data["medications"].append(f"Medication mentioned in {filename}")
                    
                    # Allergies
                    if any(keyword in text_lower for keyword in ['allergy', 'allergic', 'intolerance']):
                        medical_data["allergies"].append(f"Allergy mentioned in {filename}")
                    
                except Exception as e:
                    print(f"Error processing file {filename}: {e}")
                    continue
                    
    except Exception as e:
        print(f"Error extracting medical data: {e}")
    
    return medical_data

async def ingest_files_background(session_id: str, file_paths: List[str], user_data: Dict[str, Any]):
    """Background task for file ingestion using RAG functions"""
    try:
        ingest_tasks[session_id] = {"status": "in_progress", "detail": "Starting ingestion..."}
        
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        faiss_dir = os.path.join(session_dir, 'faiss')
        os.makedirs(faiss_dir, exist_ok=True)
        
        # Process each uploaded file
        for i, file_path in enumerate(file_paths):
            ingest_tasks[session_id]["detail"] = f"Processing file {i+1}/{len(file_paths)}"
            ingest_tasks[session_id]["percent"] = int((i / len(file_paths)) * 100)
            
            file_ext = os.path.splitext(file_path)[1].lower()
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            
            if file_ext == '.pdf':
                # Process PDF using existing knowledge_base functions
                faiss_index_path = os.path.join(faiss_dir, f"{base_name}.index")
                chunk_path = os.path.join(faiss_dir, f"{base_name}_chunks.txt")
                process_pdf_to_faiss(file_path, faiss_index_path, chunk_path)
            else:
                # For images, extract text using OCR
                ocr_data = extract_and_parse(file_path)
                # Store OCR data for later use
                ocr_file = os.path.join(session_dir, f"{base_name}_ocr.json")
                with open(ocr_file, 'w') as f:
                    json.dump(ocr_data, f)
        
        ingest_tasks[session_id] = {
            "status": "completed", 
            "detail": f"Successfully processed {len(file_paths)} files",
            "percent": 100
        }
        
        # Save session metadata
        session_meta = {
            "session_id": session_id,
            "user_data": user_data,
            "files": [os.path.basename(f) for f in file_paths],
            "faiss_dir": faiss_dir,
            "created_at": str(asyncio.get_event_loop().time())
        }
        
        session_file = os.path.join(CHATBOT_DATA_DIR, 'sessions', f"{session_id}.json")
        with open(session_file, 'w') as f:
            json.dump(session_meta, f, indent=2)
            
    except Exception as e:
        ingest_tasks[session_id] = {
            "status": "failed", 
            "detail": f"Ingestion failed: {str(e)}",
            "percent": 0
        }

def format_response(raw_text: str, is_diet_plan: bool = False) -> str:
    """
    Create clean, professional responses like ChatGPT with minimal formatting.
    
    Args:
        raw_text: Raw text from the LLM
        is_diet_plan: Whether this is a diet plan response
    
    Returns:
        Clean, professional text with minimal formatting
    """
    if not raw_text or not raw_text.strip():
        return raw_text
    
    # Step 1: Basic cleanup
    text = raw_text.strip()
    
    # Step 2: Remove excessive markdown and formatting
    text = re.sub(r'\*\*\*([^*]+)\*\*\*', r'**\1**', text)  # Fix triple asterisks
    text = re.sub(r'#{4,}', '###', text)  # Limit heading levels to ###
    
    # Step 3: Clean up excessive line breaks
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Step 4: Standardize list formatting
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            lines.append('')
            continue
        
        # Convert various bullet points to simple dashes
        if re.match(r'^[•*·]\s+', line):
            line = re.sub(r'^[•*·]\s+', '- ', line)
        elif re.match(r'^-\s+', line):
            line = line  # Already correct
        elif re.match(r'^\d+\.\s+', line):
            line = line  # Keep numbered lists
        
        lines.append(line)
    
    # Step 5: Join lines and clean up
    text = '\n'.join(lines)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Final cleanup
    
    return text

def format_general_response() -> str:
    """Short, polite response for questions outside scope."""
    return (
        "Sorry, I can only help with diet planning and nutrition for diabetes and blood pressure. "
        "Ask about diet, meals, or generate a plan (7, 10, 14, 21, or 30 days)."
    )


def map_duration_to_days(duration: str) -> Optional[int]:
    """Map supported duration keys to exact day counts."""
    mapping = {
        "1_week": 7,
        "10_days": 10,
        "14_days": 14,
        "21_days": 21,
        "1_month": 30,
    }
    return mapping.get(duration)


def parse_days_from_text(message: str) -> Optional[int]:
    """Extract requested number of days from free text like 'plan for 30 days' or '2 weeks' or '1 month'."""
    msg = message.lower()
    # Explicit days, e.g., 10 days / 14 day
    m = re.search(r"(\d+)\s*day(s)?", msg)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass
    # Weeks, e.g., 1 week / 2 weeks
    m = re.search(r"(\d+)\s*week(s)?", msg)
    if m:
        try:
            return int(m.group(1)) * 7
        except Exception:
            pass
    # Month (~30 days)
    if re.search(r"\b1\s*month\b", msg):
        return 30
    if re.search(r"\b30\s*day(s)?\b", msg):
        return 30
    return None


def unsupported_duration_response() -> str:
    """Polite guidance for unsupported duration requests."""
    return (
        "I can generate diet plans for these durations: 7 days (1 week), 10 days, 14 days, 21 days, or 30 days (1 month). "
        "Please choose one of these options."
    )

@router.post("/session")
async def create_chat_session(
    background_tasks: BackgroundTasks,
    medical_condition: str = Form(...),
    files: List[UploadFile] = File([])
):
    """Create a new chat session and upload initial files"""
    try:
        # Parse medical condition
        medical_data = json.loads(medical_condition)
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create session directory
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save uploaded files
        file_paths = []
        for file in files:
            if validate_file(file):
                filename = sanitize_filename(file.filename)
                file_path = os.path.join(session_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                file_paths.append(file_path)
        
        # Store session data
        sessions[session_id] = {
            "user_data": medical_data,
            "files": file_paths,
            "chat_history": [],
            "created_at": asyncio.get_event_loop().time()
        }
        
        # Start background ingestion if files were uploaded
        if file_paths:
            background_tasks.add_task(
                ingest_files_background, 
                session_id, 
                file_paths, 
                medical_data
            )
            ingest_tasks[session_id] = {"status": "queued", "detail": "Files queued for processing"}
        else:
            ingest_tasks[session_id] = {"status": "completed", "detail": "No files to process"}
        
        return {"session_id": session_id, "status": "created"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@router.get("/session/{session_id}/ingest-status")
async def get_ingest_status(session_id: str):
    """Get the status of file ingestion for a session"""
    if session_id not in ingest_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ingest_tasks[session_id]

@router.post("/{session_id}/message")
async def send_message(session_id: str, message_data: ChatMessage):
    """Send a message and get a response"""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        user_data = session["user_data"]
        
        # Check if ingestion is complete
        if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
            raise HTTPException(status_code=400, detail="File ingestion not complete")
        
        message_lower = message_data.message.lower()

        # Check if the question is diet-related
        if not is_diet_related_question(message_lower):
            response_text = format_general_response()
            sources = []
        else:
            # If user explicitly asks for a plan for N days/weeks/month
            requested_days = parse_days_from_text(message_lower)
            supported_days = {7, 10, 14, 21, 30}

            # Prepare context using RAG functions (used in both branches below)
            retrieved_context = ""
            faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
            if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
                try:
                    retriever = KnowledgeBaseRetriever(faiss_dir)
                    results = retriever.retrieve(message_data.message, top_k=3)
                    retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
                except Exception as e:
                    print(f"Warning: Error retrieving context: {e}")

            # Get OCR data
            ocr_data = None
            session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
            for file in os.listdir(session_dir):
                if file.endswith('_ocr.json'):
                    with open(os.path.join(session_dir, file), 'r') as f:
                        ocr_data = json.load(f)
                    break

            if requested_days is not None:
                if requested_days in supported_days:
                    # Generate a day-wise plan for the exact number of days
                    prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {requested_days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {requested_days}:'.
For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing. Do not group by week or repeat weekly cycles. Generate unique entries up to Day {requested_days}.

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
"""
                    response_text = generate_diet_plan_with_gemini(prompt)
                    # Save to session diet plans
                    if "diet_plans" not in session:
                        session["diet_plans"] = []
                    session["diet_plans"].append({
                        "duration": f"{requested_days}_days",
                        "plan": response_text,
                        "timestamp": asyncio.get_event_loop().time()
                    })
                else:
                    response_text = unsupported_duration_response()
            else:
                # General diet-related response (not an explicit multi-day plan request)
                prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Provide a helpful, evidence-based response to the following question.

User Question: {message_data.message}

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

Guidelines:
- Give clear, actionable advice with simple bullet points
- Keep formatting clean and professional
"""
                response_text = generate_diet_plan_with_gemini(prompt)
        
        # Format the response for consistent styling
        response_text = format_response(response_text, is_diet_plan=False)
        
        # Extract sources from retrieved context
        sources = []
        if retrieved_context:
            try:
                retriever = KnowledgeBaseRetriever(faiss_dir)
                results = retriever.retrieve(message_data.message, top_k=3)
                sources = [
                    {
                        "source": r["source"],
                        "excerpt": r["chunk"][:200] + "..." if len(r["chunk"]) > 200 else r["chunk"],
                        "score": r["score"]
                    }
                    for r in results
                ]
            except Exception as e:
                print(f"Warning: Error extracting sources: {e}")
        
        # Save to chat history
        message_id = str(uuid.uuid4())
        chat_entry = {
            "message_id": message_id,
            "user_message": message_data.message,
            "assistant_response": response_text,
            "sources": sources,
            "timestamp": asyncio.get_event_loop().time()
        }
        session["chat_history"].append(chat_entry)
        
        return ChatResponse(
            message_id=message_id,
            response=response_text,
            sources=sources,
            meta={"session_id": session_id, "user_data": user_data}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming chat"""
    print(f"WebSocket connection attempt for session: {session_id}")
    print(f"Available sessions: {list(sessions.keys())}")
    
    await websocket.accept()
    print(f"WebSocket accepted for session: {session_id}")
    
    if session_id not in sessions:
        print(f"Session {session_id} not found in sessions dict")
        await websocket.close(code=4004, reason="Session not found")
        return
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                message = data.get("message", "").strip()
                
                # Handle exit command
                if message.lower() in ["exit", "quit", "bye", "goodbye"]:
                    await websocket.send_json({
                        "type": "message",
                        "message": "Thank you for using our diet consultation service. Take care! 👋\n\nYou can close this chat window now."
                    })
                    await websocket.close()
                    return
                
                # Check if ingestion is complete
                if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
                    await websocket.send_json({
                        "type": "error",
                        "message": "File ingestion not complete. Please wait."
                    })
                    continue
                
                # Get patient info
                patient_info = data.get("patient_info", {})
                
                # Get session data
                session = sessions[session_id]
                user_data = session["user_data"]
                
                # Check if the question is diet-related
                if not is_diet_related_question(message):
                    response_text = format_general_response()
                else:
                    # Prepare context (same as non-streaming version)
                    retrieved_context = ""
                    faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
                    
                    if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
                        try:
                            retriever = KnowledgeBaseRetriever(faiss_dir)
                            results = retriever.retrieve(message, top_k=3)
                            retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
                        except Exception as e:
                            print(f"Warning: Error retrieving context: {e}")
                    
                    # Get OCR data
                    ocr_data = None
                    session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
                    for file in os.listdir(session_dir):
                        if file.endswith('_ocr.json'):
                            with open(os.path.join(session_dir, file), 'r') as f:
                                ocr_data = json.load(f)
                            break
                    
                    # Determine if user requested explicit day-wise plan
                    requested_days = parse_days_from_text(message)
                    supported_days = {7, 10, 14, 21, 30}

                    if requested_days is not None:
                        if requested_days in supported_days:
                            prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {requested_days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {requested_days}:'.
For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing. Do not group by week or repeat weekly cycles.

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
"""
                            response_text = generate_diet_plan_with_gemini(prompt)
                        else:
                            response_text = unsupported_duration_response()
                    else:
                        prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Provide a helpful, evidence-based response to the following question.

User Question: {message}

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

Guidelines:
- Give clear, actionable advice with simple bullet points
- Keep formatting clean and professional
"""
                        response_text = generate_diet_plan_with_gemini(prompt)
                
                # Format the response for consistent styling
                response_text = format_response(response_text, is_diet_plan=False)
                
                try:
                    # Stream response token by token (simplified - send in chunks)
                    words = response_text.split()
                    chunk_size = 5
                    for i in range(0, len(words), chunk_size):
                        chunk = " ".join(words[i:i+chunk_size])
                        await websocket.send_json({
                            "type": "token",
                            "content": chunk + (" " if i + chunk_size < len(words) else "")
                        })
                        await asyncio.sleep(0.1)  # Small delay for streaming effect
                    
                    # Extract sources
                    sources = []
                    if retrieved_context:
                        try:
                            retriever = KnowledgeBaseRetriever(faiss_dir)
                            results = retriever.retrieve(message, top_k=3)
                            sources = [
                                {
                                    "source": r["source"],
                                    "excerpt": r["chunk"][:200] + "..." if len(r["chunk"]) > 200 else r["chunk"],
                                    "score": r["score"]
                                }
                                for r in results
                            ]
                        except Exception as e:
                            print(f"Warning: Error extracting sources: {e}")
                    
                    # Send final message with sources
                    await websocket.send_json({
                        "type": "message",
                        "message": response_text,
                        "sources": sources
                    })
                    
                    # Save to chat history
                    message_id = str(uuid.uuid4())
                    chat_entry = {
                        "message_id": message_id,
                        "user_message": message,
                        "assistant_response": response_text,
                        "sources": sources,
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    session["chat_history"].append(chat_entry)
                    
                except Exception as e:
                    print(f"Error in WebSocket response: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Error generating response. Please try again."
                    })
                    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass

@router.get("/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"chat_history": sessions[session_id]["chat_history"]}

@router.post("/{session_id}/upload")
async def upload_additional_files(
    session_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload additional files to an existing session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        file_paths = []
        
        for file in files:
            if validate_file(file):
                filename = sanitize_filename(file.filename)
                file_path = os.path.join(session_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                file_paths.append(file_path)
        
        # Add to existing files
        sessions[session_id]["files"].extend(file_paths)
        
        # Start background ingestion
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            ingest_files_background, 
            session_id, 
            file_paths, 
            sessions[session_id]["user_data"]
        )
        
        return {"message": f"Uploaded {len(file_paths)} files", "files": [os.path.basename(f) for f in file_paths]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@router.post("/{session_id}/feedback")
async def submit_feedback(session_id: str, feedback: Dict[str, Any]):
    """Submit feedback for a chat session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Store feedback (you could save this to a database)
    if "feedback" not in sessions[session_id]:
        sessions[session_id]["feedback"] = []
    
    sessions[session_id]["feedback"].append({
        **feedback,
        "timestamp": asyncio.get_event_loop().time()
    })
    
    return {"message": "Feedback submitted successfully"}

@router.post("/{session_id}/generate-diet-plan")
async def generate_diet_plan(session_id: str, request: DietPlanRequest):
    """Generate a personalized diet plan"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session = sessions[session_id]
        user_data = session["user_data"]
        
        # Check if ingestion is complete
        if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
            raise HTTPException(status_code=400, detail="File ingestion not complete")
        
        # Prepare context using RAG functions
        retrieved_context = ""
        faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
        
        if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
            try:
                retriever = KnowledgeBaseRetriever(faiss_dir)
                results = retriever.retrieve("diet plan diabetes blood pressure", top_k=5)
                retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
            except Exception as e:
                print(f"Warning: Error retrieving context: {e}")
        
        # Normalize duration to exact day count
        days = map_duration_to_days(request.duration)
        if days is None:
            return JSONResponse(status_code=400, content={"detail": unsupported_duration_response()})

        # Generate strict day-wise diet plan using Gemini LLM
        prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {days}:'.
For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing. Do not group by week or repeat weekly cycles. Generate unique entries up to Day {days}.

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
"""

        diet_plan = generate_diet_plan_with_gemini(prompt)
        diet_plan = format_response(diet_plan, is_diet_plan=True)
        
        # Save to session
        if "diet_plans" not in session:
            session["diet_plans"] = []
        
        diet_plan_entry = {
            "duration": request.duration,
            "plan": diet_plan,
            "timestamp": asyncio.get_event_loop().time()
        }
        session["diet_plans"].append(diet_plan_entry)
        
        return {"diet_plan": diet_plan, "duration": request.duration}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating diet plan: {str(e)}")

@router.get("/{session_id}/medical-data")
async def get_medical_data(session_id: str):
    """Get extracted medical data from uploaded files"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        medical_data = extract_medical_data_from_files(session_id)
        return {"medical_data": medical_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting medical data: {str(e)}")

@router.get("/{session_id}/diet-plans")
async def get_diet_plans(session_id: str):
    """Get generated diet plans for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"diet_plans": sessions[session_id].get("diet_plans", [])}
