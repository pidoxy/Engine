# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import time
import json
from datetime import datetime # For parsing date strings if needed
from dotenv import load_dotenv
import uuid # For generating unique IDs
from typing import List

# --- Pydantic Models for API request/response ---
from pydantic import BaseModel, Field

class PatientCreate(BaseModel):
    full_name: str | None = None
    date_of_birth_str: str | None = Field(default=None, description="YYYY-MM-DD format")
    gender: str | None = None

class PatientResponse(BaseModel):
    patient_uuid: str
    full_name: str | None
    date_of_birth: datetime | None
    gender: str | None
    created_at: datetime

    class Config:
        from_attributes = True # For Pydantic V2 (orm_mode for V1)

class DocumentResponse(BaseModel):
    document_uuid: str
    original_filename: str
    file_type: str | None
    upload_timestamp: datetime
    processing_status: str
    extracted_text_snippet: str | None = None 
    error_message: str | None = None

    class Config:
        from_attributes = True

class ConsultationSessionSummaryResponse(BaseModel): # For listing sessions
    session_uuid: str
    mode: str
    timestamp_start: datetime
    transcript_text_snippet: str | None = None

    class Config:
        from_attributes = True

class TranscriptInput(BaseModel): # For text-based triage
    transcript_text: str

# --- Load .env file at the very beginning ---
load_dotenv() 
if not os.environ.get("GOOGLE_API_KEY"):
    print("CRITICAL WARNING: GOOGLE_API_KEY environment variable is not set. Gemini calls will fail.")
else:
    print(f"GOOGLE_API_KEY loaded successfully (first 5 chars: {os.environ.get('GOOGLE_API_KEY')[:5]}...).")
if not os.environ.get("DATABASE_URL"):
    print("CRITICAL WARNING: DATABASE_URL environment variable not set. Database operations will fail.")
else:
    print(f"DATABASE_URL loaded: {os.environ.get('DATABASE_URL').split('@')[-1]}") # Print DB host/name part

# --- Import your AI pipeline modules & DB modules AFTER load_dotenv ---
from aidcare_pipeline.transcription import transcribe_audio_local, load_whisper_model, WHISPER_MODEL_NAME
from aidcare_pipeline.symptom_extraction import extract_symptoms_with_gemini 
from aidcare_pipeline.clinical_info_extraction import extract_detailed_clinical_information
from aidcare_pipeline.rag_retrieval import get_chw_retriever, get_clinical_retriever, GuidelineRetriever
from aidcare_pipeline.recommendation import generate_triage_recommendation
from aidcare_pipeline.clinical_support_generation import generate_clinical_support_details
from aidcare_pipeline.document_processing import process_uploaded_document_task 
from aidcare_pipeline import db_models, crud
from aidcare_pipeline.database import get_db, SessionLocal # Import SessionLocal for background tasks

# --- Configuration & Setup ---
_PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
TEMP_AUDIO_DIR = os.path.join(_PROJECT_ROOT, "temp_audio")
UPLOADED_PATIENT_DOCS_DIR = os.path.join(_PROJECT_ROOT, "patient_documents_storage")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
os.makedirs(UPLOADED_PATIENT_DOCS_DIR, exist_ok=True)

# --- FastAPI App Initialization & State ---
app = FastAPI(title="AidCare AI Assistant API")
app_state = {}

# --- Lifespan Events for Model Loading ---
@app.on_event("startup")
async def startup_event():
    print("FastAPI app starting up...")
    # Ensure DB tables exist
    print("Ensuring database tables exist...")
    try:
        db_models.create_db_and_tables()
        print("Database tables created successfully.")
    except Exception as e:
        print(f"ERROR creating database tables: {e}")
        print("Please ensure the database exists and the user has permissions.")
        print("DATABASE_URL used:", os.environ.get("DATABASE_URL"))
    
    print("Initializing Whisper model...")
    try: load_whisper_model() 
    except Exception as e: print(f"ERROR initializing Whisper: {e}")

    print("Initializing CHW Guideline Retriever...")
    try: 
        app_state["chw_retriever"] = get_chw_retriever()
        if app_state.get("chw_retriever") and app_state["chw_retriever"].index.ntotal > 0:
            print(f"CHW Retriever loaded. Index: {app_state['chw_retriever'].index_path}, Vectors: {app_state['chw_retriever'].index.ntotal}")
        else:
             print(f"WARNING: CHW Retriever NOT properly loaded or index empty. Path: {getattr(app_state.get('chw_retriever'), 'index_path', 'N/A')}")
    except Exception as e: print(f"CRITICAL ERROR initializing CHW Retriever: {e}")

    print("Initializing Clinical Support Guideline Retriever...")
    try: 
        app_state["clinical_retriever"] = get_clinical_retriever()
        if app_state.get("clinical_retriever") and app_state["clinical_retriever"].index.ntotal > 0:
            print(f"Clinical Retriever loaded. Index: {app_state['clinical_retriever'].index_path}, Vectors: {app_state['clinical_retriever'].index.ntotal}")
        else:
            print(f"WARNING: Clinical Retriever NOT properly loaded or index empty. Path: {getattr(app_state.get('clinical_retriever'), 'index_path', 'N/A')}")
    except Exception as e: print(f"CRITICAL ERROR initializing Clinical Retriever: {e}")
    print("FastAPI app startup complete.")

@app.on_event("shutdown")
async def shutdown_event(): print("FastAPI app shutting down.")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_chw_retriever_dependency() -> GuidelineRetriever:
    retriever = app_state.get("chw_retriever")
    if not retriever or retriever.index.ntotal == 0: raise HTTPException(status_code=503, detail="CHW KB not available.")
    return retriever
def get_clinical_retriever_dependency() -> GuidelineRetriever:
    retriever = app_state.get("clinical_retriever")
    if not retriever or retriever.index.ntotal == 0: raise HTTPException(status_code=503, detail="Clinical KB not available.")
    return retriever

# --- API Endpoints ---
@app.get("/")
async def read_root(): return {"message": "AidCare API. Visit /docs for documentation or /health for status."}

@app.get("/health")
async def health_check():
    chw_ret_ok = app_state.get("chw_retriever") and app_state["chw_retriever"].index.ntotal > 0
    clin_ret_ok = app_state.get("clinical_retriever") and app_state["clinical_retriever"].index.ntotal > 0
    from aidcare_pipeline.transcription import asr_pipeline_global
    whisper_ok = asr_pipeline_global is not None
    return {"status": "healthy", "services": {
        "whisper_model": f"OK (Model: {WHISPER_MODEL_NAME})" if whisper_ok else "Error loading Whisper",
        "chw_retriever": f"OK ({app_state['chw_retriever'].index.ntotal} vectors)" if chw_ret_ok else "Error/Empty",
        "clinical_retriever": f"OK ({app_state['clinical_retriever'].index.ntotal} vectors)" if clin_ret_ok else "Error/Empty",
        "google_api_key": "Present" if os.environ.get("GOOGLE_API_KEY") else "MISSING - CRITICAL"
    }}

# --- Patient Management Endpoints ---
@app.post("/patients/", response_model=PatientResponse, status_code=201)
def create_new_patient_endpoint(patient_data: PatientCreate, db: Session = Depends(get_db)):
    dob_dt = None
    if patient_data.date_of_birth_str:
        try: dob_dt = datetime.strptime(patient_data.date_of_birth_str, "%Y-%m-%d")
        except ValueError: raise HTTPException(status_code=400, detail="Invalid date_of_birth_str. Use YYYY-MM-DD.")
    db_patient = crud.create_patient(db=db, full_name=patient_data.full_name, dob=dob_dt, gender=patient_data.gender)
    if not db_patient: raise HTTPException(status_code=500, detail="Failed to create patient.")
    return db_patient

@app.get("/patients/{patient_uuid}", response_model=PatientResponse)
def read_patient_by_uuid_endpoint(patient_uuid: str, db: Session = Depends(get_db)):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if db_patient is None: raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@app.get("/patients/", response_model=List[PatientResponse])
def read_all_patients_endpoint(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return crud.get_patients(db, skip=skip, limit=limit)

# --- Transcription Only Endpoint ---
@app.post("/transcribe/audio/")
async def transcribe_audio_only_endpoint(audio_file: UploadFile = File(...)): # Renamed for clarity
    # ... (same logic as your transcribe_audio_endpoint)
    unique_suffix = f"{int(time.time() * 1000)}_transcribe_only_{audio_file.filename}"
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_suffix)
    try:
        with open(file_path, "wb") as buffer: shutil.copyfileobj(audio_file.file, buffer)
        transcript = transcribe_audio_local(file_path)
        if transcript is None: raise HTTPException(status_code=500, detail="Transcription failed.")
        return {"transcript": transcript}
    except Exception as e: 
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally: 
        if os.path.exists(file_path): 
            try: os.remove(file_path)
            except Exception as e_rem: print(f"Error removing temp file {file_path}: {e_rem}")

# --- CHW Triage Endpoints ---
@app.post("/triage/process_text/{patient_uuid}") # Added patient_uuid
async def process_text_for_triage_endpoint( # Renamed
    patient_uuid: str,
    transcript_input: TranscriptInput, 
    db: Session = Depends(get_db),
    retriever: GuidelineRetriever = Depends(get_chw_retriever_dependency)
):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient: raise HTTPException(status_code=404, detail=f"Patient {patient_uuid} not found.")
    
    transcript = transcript_input.transcript_text
    if not transcript or not transcript.strip(): raise HTTPException(status_code=400, detail="Transcript empty.")
    
    session_uuid_str = str(uuid.uuid4())
    try:
        db_session = crud.create_consultation_session(db=db, patient_id=db_patient.id, mode="chw_triage_text", transcript=transcript, session_uuid=session_uuid_str)
        symptoms = extract_symptoms_with_gemini(transcript)
        if isinstance(symptoms, dict) and "error" in symptoms: raise HTTPException(status_code=500, detail=f"Symptom extraction error: {symptoms.get('error')}")
        retrieved_docs = retriever.retrieve_relevant_guidelines(symptoms, top_k=3)
        recommendation = generate_triage_recommendation(symptoms, retrieved_docs)
        if not recommendation or (isinstance(recommendation, dict) and "error" in recommendation): raise HTTPException(status_code=500, detail=f"Recommendation error: {recommendation.get('error') if isinstance(recommendation, dict) else 'Unknown'}")
        
        crud.update_consultation_session_results(db=db, session_uuid=db_session.session_uuid, extracted_info={"symptoms": symptoms}, retrieved_docs=[{"source": d.get("source_document_name"), "code": d.get("subsection_code"), "case": d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_docs], final_recommendation=recommendation)
        return {"session_uuid": db_session.session_uuid, "mode": "chw_triage_text", "input_transcript": transcript, "extracted_symptoms": symptoms, "retrieved_guidelines_summary": [{"source": d.get("source_document_name"), "code": d.get("subsection_code"), "case": d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_docs], "triage_recommendation": recommendation}
    except Exception as e: import traceback; traceback.print_exc(); raise HTTPException(status_code=500, detail=str(e))
             
@app.post("/triage/process_audio/{patient_uuid}")
async def process_audio_for_triage_endpoint( # Renamed
    patient_uuid: str,
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    retriever: GuidelineRetriever = Depends(get_chw_retriever_dependency)
):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient: raise HTTPException(status_code=404, detail=f"Patient {patient_uuid} not found.")

    session_uuid_str = str(uuid.uuid4())
    # ... (rest of your CHW audio processing, using the full logic from your pasted main.py) ...
    # ... This includes saving session to DB before and after AI calls ...
    unique_suffix = f"{int(time.time() * 1000)}_{audio_file.filename}" # From your code
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_suffix) # From your code
    try:
        with open(file_path, "wb") as buffer: shutil.copyfileobj(audio_file.file, buffer)
        transcript = transcribe_audio_local(file_path)
        if not transcript: raise HTTPException(status_code=500, detail="CHW Mode: Transcription failed.")
        
        db_session = crud.create_consultation_session(db=db, patient_id=db_patient.id, mode="chw_triage_audio", transcript=transcript, session_uuid=session_uuid_str)
        symptoms = extract_symptoms_with_gemini(transcript)
        if isinstance(symptoms, dict) and "error" in symptoms: raise HTTPException(status_code=500, detail=f"CHW Mode: Symptom extraction error: {symptoms.get('error')}")
        retrieved_docs = retriever.retrieve_relevant_guidelines(symptoms, top_k=3)
        recommendation = generate_triage_recommendation(symptoms, retrieved_docs)
        if not recommendation or (isinstance(recommendation, dict) and "error" in recommendation): raise HTTPException(status_code=500, detail=f"CHW Mode: Recommendation error: {recommendation.get('error') if isinstance(recommendation, dict) else 'Unknown'}")
        
        crud.update_consultation_session_results(db=db, session_uuid=db_session.session_uuid, extracted_info={"symptoms":symptoms}, retrieved_docs=[{"source": d.get("source_document_name"), "code": d.get("subsection_code"), "case": d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_docs], final_recommendation=recommendation)
        return {
            "session_uuid": db_session.session_uuid, "mode": "chw_triage_audio", "transcript": transcript, "extracted_symptoms": symptoms,
            "retrieved_guidelines_summary": [{"source": d.get("source_document_name"), "code": d.get("subsection_code"), "case": d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_docs],
            "triage_recommendation": recommendation
        }
    except Exception as e: import traceback; traceback.print_exc(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path): 
            try: os.remove(file_path)
            except Exception as e_rem: print(f"Error removing temp file {file_path}: {e_rem}")


# --- Clinical Support Endpoint ---
@app.post("/clinical_support/process_consultation/{patient_uuid}")
async def process_consultation_for_clinical_support_endpoint( # Renamed
    patient_uuid: str,
    audio_file: UploadFile = File(...),
    manual_context: str = Form(""), 
    db: Session = Depends(get_db),
    retriever: GuidelineRetriever = Depends(get_clinical_retriever_dependency)
):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient:
        raise HTTPException(status_code=404, detail=f"Patient with UUID {patient_uuid} not found.")

    session_uuid_str = str(uuid.uuid4())
    unique_audio_suffix = f"{int(time.time() * 1000)}_consult_{audio_file.filename}"
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_audio_suffix)

    try:
        with open(file_path, "wb") as buffer: shutil.copyfileobj(audio_file.file, buffer)
        
        transcript = transcribe_audio_local(file_path)
        if not transcript: raise HTTPException(status_code=500, detail="Clinical Support: Transcription failed.")

        db_session = crud.create_consultation_session(db=db, patient_id=db_patient.id, mode="clinical_support", transcript=transcript, manual_context_input=manual_context, session_uuid=session_uuid_str)
        
        extracted_info = extract_detailed_clinical_information(transcript)
        if isinstance(extracted_info, dict) and "error" in extracted_info:
             raise HTTPException(status_code=500, detail=f"Clinical Support: Detailed info extraction error: {extracted_info.get('error')}")

        query_terms_for_rag = extracted_info.get("presenting_symptoms", [])
        if manual_context and manual_context.strip():
            manual_context_keywords = [term for term in manual_context.lower().split() if len(term) > 2] 
            query_terms_for_rag = list(set(query_terms_for_rag + manual_context_keywords))
        
        retrieved_rag_docs = []
        if query_terms_for_rag:
            retrieved_rag_docs = retriever.retrieve_relevant_guidelines(query_terms_for_rag, top_k=5)
            print(f"Clinical Support - Phase 4 Complete. Retrieved {len(retrieved_rag_docs)} general knowledge documents.")

        # Fetch historical document texts for this patient
        print(f"Clinical Support - Fetching historical documents for patient UUID: {patient_uuid} (DB ID: {db_patient.id})")
        patient_docs_from_db = crud.get_patient_documents(db, patient_id=db_patient.id, limit=5) # Get last 5 processed docs
        patient_historical_document_texts = []
        if patient_docs_from_db:
            for doc in patient_docs_from_db:
                if doc.processing_status in ["completed", "completed_empty_text", "completed_with_errors"] and doc.extracted_text:

                    doc_header = f"--- Patient Document: '{doc.original_filename}' (Uploaded: {doc.upload_timestamp.strftime('%Y-%m-%d') if doc.upload_timestamp else 'N/A'}) ---"
                    snippet = doc.extracted_text[:1000] + ("..." if len(doc.extracted_text) > 1000 else "")
                    patient_historical_document_texts.append(f"{doc_header}\n{snippet}")
                elif doc.processing_status == "failed" and doc.error_message:
                    patient_historical_document_texts.append(f"--- Patient Document: '{doc.original_filename}' (Processing Failed) ---\nError: {doc.error_message[:200]}...")
        
        print(f"Clinical Support - Prepared {len(patient_historical_document_texts)} historical document snippets for context.")
        # --- END OF FETCHING HISTORICAL DOCUMENT TEXTS ---
        
        support_details = generate_clinical_support_details(
            extracted_clinical_info=extracted_info, 
            retrieved_knowledge_entries=retrieved_rag_docs,
            manual_context_supplement=manual_context,
            patient_historical_document_texts=patient_historical_document_texts
        )
        if isinstance(support_details, dict) and "error" in support_details:
            raise HTTPException(status_code=500, detail=f"Clinical Support: Failed to generate support details: {support_details.get('error')}")

        crud.update_consultation_session_results(db=db, session_uuid=db_session.session_uuid, extracted_info=extracted_info, retrieved_docs=[{"source_type": d.get("source_type"), "source_name": d.get("source_document_name"), "hint": d.get("disease_info", {}).get("disease") or d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_rag_docs], final_recommendation=support_details)

        return {
            "session_uuid": db_session.session_uuid, "mode": "clinical_support", "transcript": transcript,
            "extracted_clinical_info": extracted_info, "manual_context_provided": manual_context,
            "retrieved_documents_summary": [{"source_type": d.get("source_type"), "source_name": d.get("source_document_name"), "hint": d.get("disease_info", {}).get("disease") or d.get("case"), "score": d.get("retrieval_score (distance)")} for d in retrieved_rag_docs],
            "clinical_support_details": support_details,
            "historical_context_summary": [
                f"Used text from '{doc.original_filename}' (Status: {doc.processing_status})"
            for doc in patient_docs_from_db if doc.processing_status in ["completed", "completed_empty_text", "completed_with_errors"] and doc.extracted_text
            ]
        }
    except Exception as e: import traceback; traceback.print_exc(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path): 
            try: os.remove(file_path)
            except Exception as e_rem: print(f"Error removing temp file {file_path}: {e_rem}")

# --- Patient Document Upload Endpoint ---
@app.post("/patients/{patient_uuid}/upload_document/", response_model=DocumentResponse)
async def upload_patient_document_endpoint(
    patient_uuid: str, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient:
        raise HTTPException(status_code=404, detail=f"Patient with UUID {patient_uuid} not found.")

    original_filename = file.filename
    safe_filename_base = "".join(c if c.isalnum() or c in ['.', '_'] else '_' for c in original_filename)
    doc_db_uuid_str = str(uuid.uuid4())

    patient_specific_docs_dir = os.path.join(UPLOADED_PATIENT_DOCS_DIR, db_patient.patient_uuid)
    os.makedirs(patient_specific_docs_dir, exist_ok=True)
    storage_filename_on_disk = f"{doc_db_uuid_str}_{safe_filename_base}" 
    file_path_on_server = os.path.join(patient_specific_docs_dir, storage_filename_on_disk)

    try:
        with open(file_path_on_server, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        
        db_document = crud.create_patient_document(
            db=db, patient_id=db_patient.id, document_uuid=doc_db_uuid_str, 
            original_filename=original_filename, storage_path=file_path_on_server, 
            file_type=file.content_type
        )
        # No need to commit here if crud.create_patient_document handles it.
        
        print(f"Document for P_UUID {db_patient.patient_uuid} saved to {file_path_on_server} (Doc_UUID: {db_document.document_uuid})")

        background_tasks.add_task(
            process_uploaded_document_task, db_provider=SessionLocal, 
            document_uuid=db_document.document_uuid, file_path_on_server=file_path_on_server, 
            original_filename=original_filename, content_type=file.content_type
        )
        # Return the db_document object which Pydantic will serialize according to DocumentResponse
        return db_document 
    except Exception as e:
        if os.path.exists(file_path_on_server): 
            try: os.remove(file_path_on_server)
            except: pass
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload/queue file: {str(e)}")
    finally:
        await file.close()


# --- Endpoints to retrieve patient data (examples) ---
@app.get("/patients/{patient_uuid}/documents/", response_model=List[DocumentResponse])
def list_patient_documents_endpoint(patient_uuid: str, db: Session = Depends(get_db), limit: int = 10):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    documents = crud.get_patient_documents(db, patient_id=db_patient.id, limit=limit)

    response_docs = []
    for doc in documents:
        snippet = None
        if doc.extracted_text:
            snippet = doc.extracted_text + ("..." if len(doc.extracted_text) > 100 else "")
        response_docs.append({
                "document_uuid": doc.document_uuid,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "upload_timestamp": doc.upload_timestamp,
                "processing_status": doc.processing_status,
                "extracted_text_snippet": snippet,
                "error_message": doc.error_message # This now comes from the DB model
            })
    return response_docs
    

@app.get("/patients/{patient_uuid}/consultations/", response_model=List[ConsultationSessionSummaryResponse])
def list_patient_consultations_endpoint(patient_uuid: str, db: Session = Depends(get_db), limit: int = 5):
    db_patient = crud.get_patient_by_uuid(db, patient_uuid=patient_uuid)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    sessions = crud.get_patient_consultation_history(db, patient_id=db_patient.id, limit=limit)
    for session in sessions: # Prepare snippet for response model
        if session.transcript_text:
            session.transcript_text_snippet = session.transcript_text[:100] + "..."
        else:
            session.transcript_text_snippet = None
    return sessions