# main.py
import asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import time
import json
# import asyncio # Only if you have actual async operations in your pipeline funcs

# --- Import your AI pipeline modules ---
from aidcare_pipeline.transcription import transcribe_audio_local, load_whisper_model
from aidcare_pipeline.symptom_extraction import extract_symptoms_with_gemini 
from aidcare_pipeline.clinical_info_extraction import extract_detailed_clinical_information # New import
from aidcare_pipeline.clinical_support_generation import generate_clinical_support_details

from aidcare_pipeline.rag_retrieval import (
    get_chw_retriever, 
    get_clinical_retriever, 
    GuidelineRetriever # Import class for type hinting
)
from aidcare_pipeline.recommendation import generate_triage_recommendation
# For Clinical Mode - Step 2 (You'll create this function/module later)
# from aidcare_pipeline.clinical_support_generation import generate_clinical_support_details_with_gemini

# --- Environment Variable Checks & Setup ---
if not os.environ.get("GOOGLE_API_KEY"):
    print("CRITICAL WARNING: GOOGLE_API_KEY environment variable is not set. Gemini calls will fail.")

TEMP_AUDIO_DIR = "temp_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

# --- FastAPI App Initialization & State ---
app = FastAPI(title="AidCare AI Assistant API")
app_state = {} # To store loaded models/retrievers

# --- Lifespan Events for Model Loading ---
@app.on_event("startup")
async def startup_event():
    print("FastAPI app starting up...")
    
    print("Initializing Whisper model...")
    load_whisper_model() # This loads the model into its module's global scope
    
    print("Initializing CHW Guideline Retriever...")
    try:
        app_state["chw_retriever"] = get_chw_retriever()
        if app_state["chw_retriever"] and app_state["chw_retriever"].index.ntotal > 0:
            print(f"CHW Retriever loaded. Index has {app_state['chw_retriever'].index.ntotal} vectors.")
        else:
            print("ERROR: CHW Retriever FAILED to load or index is empty.")
    except Exception as e:
        print(f"CRITICAL ERROR initializing CHW Retriever: {e}")
        # Consider if the app should fail to start if a retriever doesn't load
        # For now, it will continue, but endpoints using it will fail.

    print("Initializing Clinical Support Guideline Retriever...")
    try:
        app_state["clinical_retriever"] = get_clinical_retriever()
        if app_state["clinical_retriever"] and app_state["clinical_retriever"].index.ntotal > 0:
            print(f"Clinical Retriever loaded. Index has {app_state['clinical_retriever'].index.ntotal} vectors.")
        else:
            print("ERROR: Clinical Retriever FAILED to load or index is empty.")
    except Exception as e:
        print(f"CRITICAL ERROR initializing Clinical Retriever: {e}")

    print("FastAPI app startup complete (check logs for retriever status).")

@app.on_event("shutdown")
async def shutdown_event():
    print("FastAPI app shutting down.")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Add deployed frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies for Retrievers ---
def get_chw_retriever_dependency() -> GuidelineRetriever:
    retriever = app_state.get("chw_retriever")
    if not retriever:
        print("Error in dependency: CHW Retriever not available in app_state.")
        raise HTTPException(status_code=503, detail="CHW Triage knowledge base not available. Please try again later.")
    return retriever

def get_clinical_retriever_dependency() -> GuidelineRetriever:
    retriever = app_state.get("clinical_retriever")
    if not retriever:
        print("Error in dependency: Clinical Retriever not available in app_state.")
        raise HTTPException(status_code=503, detail="Clinical Support knowledge base not available. Please try again later.")
    return retriever

# --- API Endpoints ---

@app.post("/triage/process_audio/") # For CHW Mode
async def process_audio_for_triage(
    audio_file: UploadFile = File(...),
    retriever: GuidelineRetriever = Depends(get_chw_retriever_dependency) # Use CHW retriever
):
    unique_suffix = f"{int(time.time() * 1000)}_{audio_file.filename}"
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_suffix)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        print(f"Audio file saved to {file_path}")

        print("CHW Mode - Starting Phase 2: Transcription...")
        transcript = transcribe_audio_local(file_path)
        if not transcript:
            raise HTTPException(status_code=500, detail="CHW Mode: Transcription failed or returned empty.")
        print(f"CHW Mode - Phase 2 Complete. Transcript: {transcript[:100]}...")

        print("CHW Mode - Starting Phase 3: Symptom Extraction...")
        symptoms = extract_symptoms_with_gemini(transcript) # Using the CHW-focused symptom extraction
        if "error" in symptoms if isinstance(symptoms, dict) else False:
            raise HTTPException(status_code=500, detail=f"CHW Mode: Symptom extraction failed: {symptoms.get('error')}")
        print(f"CHW Mode - Phase 3 Complete. Extracted Symptoms: {symptoms}")

        print("CHW Mode - Starting Phase 4: Guideline Retrieval...")
        retrieved_docs = retriever.retrieve_relevant_guidelines(symptoms, top_k=3)
        print(f"CHW Mode - Phase 4 Complete. Retrieved {len(retrieved_docs)} guideline documents.")

        print("CHW Mode - Starting Phase 5: Recommendation Generation...")
        # This uses the generate_triage_recommendation for CHWs
        recommendation = generate_triage_recommendation(symptoms, retrieved_docs) 
        if not recommendation or ("error" in recommendation if isinstance(recommendation, dict) else False):
            error_detail = recommendation.get("error") if isinstance(recommendation, dict) else "Unknown error"
            raise HTTPException(status_code=500, detail=f"CHW Mode: Failed to generate recommendation: {error_detail}")
        print("CHW Mode - Phase 5 Complete. Recommendation generated.")
        
        return {
            "mode": "chw_triage",
            "transcript": transcript,
            "extracted_symptoms": symptoms,
            "retrieved_guidelines_summary": [
                {"source": d.get("source_document_name"), "code": d.get("subsection_code"), "case": d.get("case"), "score": d.get("retrieval_score (distance)")} 
                for d in retrieved_docs
            ],
            "triage_recommendation": recommendation
        }
    # ... (keep existing except FileNotFoundError, ValueError, HTTPException, Exception, finally blocks) ...
    except FileNotFoundError as e:
        print(f"File not found error: {e}")
        raise HTTPException(status_code=404, detail=f"Required file not found: {e}")
    except ValueError as e: 
        print(f"Value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e 
    except Exception as e:
        print(f"Unhandled error processing audio for CHW triage: {e}")
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Temporary audio file {file_path} removed.")
            except Exception as e_rem:
                print(f"Error removing temporary file {file_path}: {e_rem}")


# Placeholder for Clinical Support Endpoint - We will build this out next
@app.post("/clinical_support/process_consultation/")
async def process_consultation_for_clinical_support(
    audio_file: UploadFile = File(...),
    retriever: GuidelineRetriever = Depends(get_clinical_retriever_dependency) # Use Clinical retriever
):
    unique_suffix = f"{int(time.time() * 1000)}_{audio_file.filename}"
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_suffix)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        print(f"Clinical Support - Audio file saved to {file_path}")

        # Phase 2: Transcription
        print("Clinical Support - Starting Phase 2: Transcription...")
        transcript = transcribe_audio_local(file_path)
        if not transcript:
            raise HTTPException(status_code=500, detail="Clinical Support: Transcription failed.")
        print(f"Clinical Support - Phase 2 Complete. Transcript: {transcript[:100]}...")

        # Clinical Phase 3: Rich Information Extraction
        print("Clinical Support - Starting Clinical Phase 3: Detailed Information Extraction...")
        extracted_info = extract_detailed_clinical_information(transcript)
        if "error" in extracted_info:
             raise HTTPException(status_code=500, detail=f"Clinical Support: Detailed info extraction failed: {extracted_info.get('error')}")
        print(f"Clinical Support - Clinical Phase 3 Complete. Extracted Info: {json.dumps(extracted_info, indent=2)[:300]}...") # Print a snippet

        # Formulate query for RAG from extracted info
        # Example: combine presenting symptoms and key findings
        query_symptoms_for_rag = extracted_info.get("presenting_symptoms", [])
        key_findings_for_rag = extracted_info.get("key_examination_findings_verbalized", [])
        combined_query_terms = list(set(query_symptoms_for_rag + key_findings_for_rag)) # Unique terms

        # Phase 4: RAG Retrieval (using clinical retriever)
        print("Clinical Support - Starting Phase 4: Knowledge Retrieval...")
        retrieved_docs = []
        if combined_query_terms:
            retrieved_docs = retriever.retrieve_relevant_guidelines(combined_query_terms, top_k=3) # Or top_k=5
        print(f"Clinical Support - Phase 4 Complete. Retrieved {len(retrieved_docs)} documents.")

        # Clinical Phase 5: Clinical Support Details Generation
        print("Clinical Support - Starting Clinical Phase 5: Support Details Generation...")
        support_details = generate_clinical_support_details(extracted_info, retrieved_docs)
        if "error" in support_details:
            raise HTTPException(status_code=500, detail=f"Clinical Support: Failed to generate support details: {support_details.get('error')}")
        print("Clinical Support - Clinical Phase 5 Complete. Support details generated.")

        return {
            "mode": "clinical_support",
            "transcript": transcript,
            "extracted_clinical_info": extracted_info, # Send the rich extracted info
            "retrieved_documents_summary": [ # Summarize what was retrieved
                {
                    "source_type": d.get("source_type"),
                    "source_name": d.get("source_document_name"),
                    "retrieved_content_hint": d.get("disease_info", {}).get("disease") or d.get("case") or "Guideline Entry",
                    "score": d.get("retrieval_score (distance)")
                } for d in retrieved_docs
            ],
            "clinical_support_details": support_details # The main payload for the UI
        }

    except FileNotFoundError as e: # ... (keep existing error handling) ...
        print(f"File not found error: {e}")
        raise HTTPException(status_code=404, detail=f"Required file not found: {e}")
    except ValueError as e: 
        print(f"Value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e 
    except Exception as e:
        print(f"Unhandled error processing consultation for clinical support: {e}")
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Temporary audio file {file_path} removed.")
            except Exception as e_rem:
                print(f"Error removing temporary file {file_path}: {e_rem}")
                
                
@app.get("/")
async def read_root():
    return {"message": "Welcome to AidCare API. Use /docs for API documentation and health check."}

@app.get("/health")
async def health_check():
    chw_ret_status = "Not initialized"
    clin_ret_status = "Not initialized"
    if "chw_retriever" in app_state and app_state["chw_retriever"] and app_state["chw_retriever"].index.ntotal > 0:
        chw_ret_status = f"Initialized ({app_state['chw_retriever'].index.ntotal} vectors)"
    if "clinical_retriever" in app_state and app_state["clinical_retriever"] and app_state["clinical_retriever"].index.ntotal > 0:
        clin_ret_status = f"Initialized ({app_state['clinical_retriever'].index.ntotal} vectors)"

    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "whisper_model": "Loaded via transcription.py on first call or startup",
            "chw_retriever": chw_ret_status,
            "clinical_retriever": clin_ret_status,
            "gemini_api_connectivity": "Dependent_on_key_and_network"
        }
    }