# aidcare_pipeline/clinical_support_generation.py
import google.generativeai as genai
import json
import os
import time

GEMINI_MODEL_CLINICAL_SUPPORT = os.getenv("GEMINI_MODEL_CLINICAL_SUPPORT", 'gemini-1.5-flash-latest')
GOOGLE_API_KEY_CLINICAL_SUPPORT = os.environ.get("GOOGLE_API_KEY")

def generate_clinical_support_details(
    extracted_clinical_info: dict, 
    retrieved_knowledge_entries: list
) -> dict:
    """
    Generates structured clinical support details (potential conditions, tests, meds, alerts)
    based on extracted patient info and retrieved knowledge base entries.
    """
    if not GOOGLE_API_KEY_CLINICAL_SUPPORT:
        print("ERROR: GOOGLE_API_KEY not found for clinical support generation.")
        return {"error": "Configuration error: Missing Google API Key."}
    
    try:
        genai.configure(api_key=GOOGLE_API_KEY_CLINICAL_SUPPORT)
    except Exception as e:
        return {"error": f"Gemini API key configuration error: {e}"}

    model = genai.GenerativeModel(GEMINI_MODEL_CLINICAL_SUPPORT)

    # --- Prepare context from extracted_clinical_info ---
    patient_context_str = "Patient's Current Presentation & History:\n"
    patient_context_str += f"- Presenting Symptoms: {', '.join(extracted_clinical_info.get('presenting_symptoms', []))}\n"
    if extracted_clinical_info.get('symptom_details'):
        patient_context_str += "- Symptom Details:\n"
        for symptom, detail in extracted_clinical_info.get('symptom_details', {}).items():
            patient_context_str += f"  - {symptom}: {detail}\n"
    if extracted_clinical_info.get('relevant_medical_history'):
        patient_context_str += f"- Relevant Medical History: {', '.join(extracted_clinical_info.get('relevant_medical_history', []))}\n"
    if extracted_clinical_info.get('allergies_mentioned'):
        patient_context_str += f"- Known Allergies: {', '.join(extracted_clinical_info.get('allergies_mentioned', []))}\n"
    # Add other fields as needed (family history, social, meds, exam findings)

    # --- Prepare context from retrieved_knowledge_entries (textbooks, guidelines) ---
    knowledge_context_str = "\nRetrieved Relevant Knowledge Base Information:\n"
    if not retrieved_knowledge_entries:
        knowledge_context_str += "No specific knowledge base entries were retrieved for this presentation.\n"
    else:
        for i, entry in enumerate(retrieved_knowledge_entries[:3]): # Top 3
            knowledge_context_str += f"\n--- Knowledge Entry {i+1} ---\n"
            knowledge_context_str += f"Source Type: {entry.get('source_type', 'N/A')}\n"
            knowledge_context_str += f"Source Name: {entry.get('source_document_name', 'N/A')}\n"
            if entry.get('source_type') == "Textbook" and entry.get('disease_info'):
                disease = entry['disease_info']
                knowledge_context_str += f"Disease: {disease.get('disease', 'N/A')}\n"
                knowledge_context_str += f"Textbook Symptoms: {', '.join(disease.get('symptoms', []))}\n"
                knowledge_context_str += f"Textbook Investigations: {', '.join(disease.get('diagnosis', {}).get('investigations', []))}\n"
                knowledge_context_str += f"Textbook Treatment (First-line): {', '.join(disease.get('treatment', {}).get('first_line', []))}\n"
                if disease.get('contextual_notes', {}).get('triage_alert'):
                    knowledge_context_str += f"Textbook Triage Alert: {disease['contextual_notes']['triage_alert']}\n"
            elif entry.get('source_type') == "Guideline":
                knowledge_context_str += f"Guideline Case: {entry.get('case', 'N/A')}\n"
                knowledge_context_str += f"Guideline Clinical Judgement: {entry.get('clinical_judgement', 'N/A')}\n"
                knowledge_context_str += f"Guideline Actions: {', '.join(entry.get('action', []))}\n"
            knowledge_context_str += f"Original Chunk Snippet (for context): {entry.get('original_text_chunk', '')[:200]}...\n"


    system_instruction = (
        "You are an AI Clinical Decision Support assistant for medical professionals. "
        "Your role is to synthesize patient information and relevant medical knowledge (from provided textbook snippets and guidelines) "
        "to suggest potential conditions, investigations, medication considerations, and highlight alerts. "
        "You do NOT make definitive diagnoses. Prioritize information directly present in the 'Retrieved Relevant Knowledge Base Information'. "
        "If patient allergies are mentioned, consider them for medication suggestions. "
        "The output must be a structured JSON object."
    )
    prompt = f"""
    {patient_context_str}
    {knowledge_context_str}

    Task:
    Based ONLY on the 'Patient's Current Presentation & History' and the 'Retrieved Relevant Knowledge Base Information', generate clinical support suggestions.
    Structure your response as a SINGLE JSON object with the following keys:
    - "potential_conditions": (list of objects, each with "name": string, "reasoning": string, "source_ref": list of strings [e.g., "Textbook: OHCM - Anemia"])
    - "suggested_investigations": (list of objects, each with "test": string, "rationale": string, "source_ref": list of strings)
    - "medication_considerations_info": (list of objects, each with "drug_class_or_info": string, "details": string, "source_ref": list of strings). This is for informational purposes, not direct prescription. Note any patient allergies.
    - "alerts_and_flags": (list of strings) Critical points, warnings, or red flags derived from the context or patient history.
    - "differential_summary_for_doctor": (string) A concise summary synthesizing the findings and primary considerations for the doctor.

    Example for "potential_conditions": [{{"name": "Iron Deficiency Anemia", "reasoning": "Fatigue and pallor are key.", "source_ref": ["Textbook: OHCM - Anemia"]}}]
    If knowledge base information is sparse for a category, provide a general suggestion or state that more specific info is needed.
    
    Return ONLY the JSON object.
    JSON Response:
    """

    generation_config = genai.types.GenerationConfig(
        temperature=0.2, # More deterministic for clinical support
        max_output_tokens=2048, # Allow for more detailed output
        # response_mime_type="application/json" # Highly recommended for Gemini 1.5
    )

    full_prompt_to_send = prompt
    if GEMINI_MODEL_CLINICAL_SUPPORT.startswith('gemini-1.5'):
        # generation_config.response_mime_type="application/json" # Uncomment if you want strict JSON output
        model_instance = genai.GenerativeModel(
            GEMINI_MODEL_CLINICAL_SUPPORT,
            system_instruction=system_instruction,
            generation_config=generation_config
        )
    else:
        model_instance = model
        full_prompt_to_send = system_instruction + "\n\n" + prompt
    
    # ... (Add your robust Gemini call and JSON parsing logic, similar to other Gemini functions) ...
    # ... (This includes retries, cleaning markdown, and parsing the JSON string) ...
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = model_instance.generate_content(full_prompt_to_send)
            raw_json_str = response.parts[0].text.strip() if response.parts else (response.text.strip() if hasattr(response, 'text') else "")
            
            if raw_json_str.startswith("```json"): raw_json_str = raw_json_str[len("```json"):]
            if raw_json_str.startswith("```"): raw_json_str = raw_json_str[len("```"):]
            if raw_json_str.endswith("```"): raw_json_str = raw_json_str[:-len("```")]
            raw_json_str = raw_json_str.strip()

            if not raw_json_str:
                if attempt < max_retries - 1: time.sleep(1); continue
                return {"error": "Gemini returned an empty string for clinical support generation."}
            
            support_details = json.loads(raw_json_str)
            # Basic validation of expected structure
            expected_keys = ["potential_conditions", "suggested_investigations", "medication_considerations_info", "alerts_and_flags", "differential_summary_for_doctor"]
            if not all(key in support_details for key in expected_keys):
                print(f"Warning: Clinical support response missing one or more expected keys. Got: {support_details.keys()}")
            return support_details

        except json.JSONDecodeError as e:
            print(f"Clinical Support Gen - JSONDecodeError (Attempt {attempt+1}): {raw_json_str} | Error: {e}")
            if attempt < max_retries - 1: time.sleep(2 * (attempt + 1)); continue
            return {"error": f"Failed to decode JSON for clinical support. Last response: {raw_json_str}"}
        except Exception as e:
            print(f"Clinical Support Gen - Exception (Attempt {attempt+1}): {e}")
            if attempt < max_retries -1: time.sleep(2 * (attempt + 1)); continue
            return {"error": f"Unhandled error during clinical support generation: {e}"}
            
    return {"error": "Failed clinical support generation after all retries."}