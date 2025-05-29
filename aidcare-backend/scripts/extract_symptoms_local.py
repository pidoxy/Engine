import google.generativeai as genai
import json
import os
import time
from pathlib import Path

# --- Configuration ---
GEMINI_MODEL_NAME = 'gemini-1.5-flash-latest'

# --- Symptom Extraction Function ---
def extract_symptoms_with_gemini(transcript_text, api_key_to_use):
    try:
        genai.configure(api_key=api_key_to_use)
    except Exception as e:
        print(f"Error configuring Gemini API key: {e}. Ensure the key is valid.")
        return []

    generation_config = genai.types.GenerationConfig(
        temperature=0.1,
        max_output_tokens=256,
    )

    system_instruction = (
        "You are an expert medical information extractor. Your task is to carefully read the provided "
        "CHW-patient conversation transcript and identify all symptoms mentioned by the patient or "
        "observed by the CHW. Focus on physical ailments, discomforts, or unusual conditions. "
        "List only the symptoms. Exclude diagnoses, treatments, and general statements like "
        "'I am not feeling well' unless accompanied by specific symptoms. "
        "Normalize symptom terms to common medical phrasing where appropriate. "
        "Handle negations correctly (e.g., 'no fever' should not list 'fever')."
    )

    prompt = f"""
    Transcript:
    ---
    {transcript_text}
    ---

    Based on the transcript above, extract all symptoms mentioned.
    Return the symptoms as a JSON formatted list of strings.
    For example: ["headache", "fever", "cough"]
    If no symptoms are clearly mentioned, return an empty JSON list: []

    Symptoms (JSON list):
    """

    if GEMINI_MODEL_NAME.startswith('gemini-1.5'):
        model_instance = genai.GenerativeModel(
            GEMINI_MODEL_NAME,
            system_instruction=system_instruction,
            generation_config=generation_config
        )
    else:
        model_instance = genai.GenerativeModel(GEMINI_MODEL_NAME)
        prompt = system_instruction + "\n\n" + prompt

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model_instance.generate_content(prompt)

            if not response.parts:
                print("Warning: Empty Gemini response.")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return []

            raw_json_str = response.parts[0].text.strip()

            if raw_json_str.startswith("```json"):
                raw_json_str = raw_json_str[len("```json"):].strip()
            if raw_json_str.startswith("```"):
                raw_json_str = raw_json_str[len("```"):].strip()
            if raw_json_str.endswith("```"):
                raw_json_str = raw_json_str[:-len("```")].strip()

            print(f"Raw Gemini response content: {raw_json_str}")
            extracted_data = json.loads(raw_json_str)

            symptoms_list = []
            if isinstance(extracted_data, list):
                symptoms_list = extracted_data
            elif isinstance(extracted_data, dict):
                for value in extracted_data.values():
                    if isinstance(value, list):
                        symptoms_list = value
                        break

            validated_symptoms = [str(s).lower().strip() for s in symptoms_list if isinstance(s, (str, int, float)) and str(s).strip()]
            seen = set()
            return [s for s in validated_symptoms if not (s in seen or seen.add(s))]

        except json.JSONDecodeError:
            print(f"JSON decode error: '{raw_json_str}'")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            return []
        except Exception as e:
            print(f"Error during API call: {e}")
            if "rate limit" in str(e).lower() and attempt < max_retries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            elif attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            return []
    return []

# --- File Selection Function ---
def prompt_file_selection(folder_path="transcripts"):
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Folder '{folder_path}' not found. Please create it and add .txt files.")
        return []

    transcript_files = list(folder.glob("*.txt"))
    if not transcript_files:
        print("No .txt files found in the folder.")
        return []

    print("\nAvailable Transcript Files:")
    for idx, file in enumerate(transcript_files, 1):
        print(f"{idx}. {file.name}")

    selections = input("\nEnter the numbers of the files you want to process (e.g., 1 2 4): ")
    selected_indices = [int(x.strip()) for x in selections.strip().split() if x.strip().isdigit()]
    selected_files = [transcript_files[i-1] for i in selected_indices if 0 < i <= len(transcript_files)]

    transcripts = []
    for file in selected_files:
        try:
            content = file.read_text(encoding="utf-8").strip()
            if content:
                transcripts.append((file.name, content))
        except Exception as e:
            print(f"Error reading {file.name}: {e}")
    
    return transcripts

# --- Main Execution ---
if __name__ == "__main__":
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("API key not found. Set GOOGLE_API_KEY as an environment variable.")
        exit()

    transcripts_to_test = prompt_file_selection("transcripts")
    if not transcripts_to_test:
        print("No transcripts selected. Exiting.")
        exit()

    print("\n--- Starting Symptom Extraction ---")
    for i, (filename, transcript) in enumerate(transcripts_to_test):
        print(f"\nProcessing File {filename}")
        extracted_symptoms = extract_symptoms_with_gemini(transcript, api_key)
        print(f"Extracted Symptoms from {filename}: {extracted_symptoms}")
        print("-" * 40)
        time.sleep(1)
