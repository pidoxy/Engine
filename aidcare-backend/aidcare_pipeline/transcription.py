# aidcare_pipeline/transcription.py
import torch
from transformers import pipeline, WhisperProcessor, WhisperFeatureExtractor, WhisperTokenizer
import warnings
import os

# Suppress specific FutureWarning
warnings.filterwarnings("ignore", message="The input name `inputs` is deprecated. Please make sure to use `input_features` instead.")

# Global variable for the ASR pipeline (loaded once)
asr_pipeline_global = None
WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL_NAME", "openai/whisper-base") # Default model

def load_whisper_model():
    global asr_pipeline_global
    if asr_pipeline_global is None:
        print(f"Loading Whisper model '{WHISPER_MODEL_NAME}' for transcription...")
        device = "mps" if torch.backends.mps.is_available() and torch.backends.mps.is_built() else \
                 "cuda:0" if torch.cuda.is_available() else \
                 "cpu"
        torch_dtype = torch.float16 if device.startswith("cuda") else torch.float32
        
        # More explicit loading for better control and potential future optimizations
        feature_extractor = WhisperFeatureExtractor.from_pretrained(WHISPER_MODEL_NAME)
        tokenizer = WhisperTokenizer.from_pretrained(WHISPER_MODEL_NAME, language="english", task="transcribe") # Assuming English for now
        processor = WhisperProcessor(feature_extractor=feature_extractor, tokenizer=tokenizer)

        asr_pipeline_global = pipeline(
            "automatic-speech-recognition",
            model=WHISPER_MODEL_NAME,
            tokenizer=processor.tokenizer, # Use tokenizer from processor
            feature_extractor=processor.feature_extractor, # Use feature_extractor from processor
            device=device,
            torch_dtype=torch_dtype,
            chunk_length_s=30,
        )
        print(f"Whisper model '{WHISPER_MODEL_NAME}' loaded on device '{device}'.")
    return asr_pipeline_global

def transcribe_audio_local(audio_file_path: str, language: str = None) -> str:
    """
    Transcribe audio using Whisper.

    Args:
        audio_file_path: Path to the audio file
        language: Optional BCP-47 language code hint (e.g., 'ha', 'yo', 'ig').
                  Improves accuracy for non-English audio. Pass None for auto-detection.

    Returns:
        Transcribed text string
    """
    pipeline_instance = load_whisper_model() # Ensures model is loaded
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    try:
        print(f"Transcribing audio file: {audio_file_path} (language hint: {language or 'auto'})...")

        # Build generate_kwargs with optional language hint for Nigerian languages
        generate_kwargs = {}
        if language and language not in ('en', 'pcm'):
            # Whisper supports Hausa (ha), Yoruba (yo), Igbo (ig)
            generate_kwargs["language"] = language
            print(f"Using Whisper language hint: {language}")

        # For audio > 30s, return_timestamps=True is needed for long-form generation
        transcription_output = pipeline_instance(
            audio_file_path,
            return_timestamps=True,
            generate_kwargs=generate_kwargs if generate_kwargs else None,
        )
        transcript_text = transcription_output["text"].strip()
        print(f"Transcription successful for {audio_file_path}.")
        return transcript_text
    except Exception as e:
        print(f"Error during transcription for {audio_file_path}: {e}")
        raise # Re-raise the exception to be handled by FastAPI