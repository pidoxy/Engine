# aidcare_pipeline/tts_service.py
# ElevenLabs TTS service for Nigerian language audio generation
# Uses eleven_multilingual_v2 model which supports Hausa, Yoruba, Igbo

import httpx
import os
from typing import Optional

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
ELEVENLABS_MODEL = "eleven_multilingual_v2"

LANGUAGE_VOICE_IDS: dict[str, str] = {
    'en':  os.getenv("ELEVENLABS_VOICE_EN",  "EXAVITQu4vr4xnSDxMaL"),
    'ha':  os.getenv("ELEVENLABS_VOICE_HA",  "6iWkTWoJzrCzM5FKyQ9g"),
    'yo':  os.getenv("ELEVENLABS_VOICE_YO",  "x86DtpnPPuq2BpEiKPRy"),
    'ig':  os.getenv("ELEVENLABS_VOICE_IG",  "nw6EIXCsQ89uJMjytYb8"),
    'pcm': os.getenv("ELEVENLABS_VOICE_PCM", "QLniWkGYsJa91mXrxl3c"),
}

MAX_CHARS = 2500


async def generate_speech(
    text: str,
    language: str,
    voice_id: Optional[str] = None
) -> bytes:
    """
    Call ElevenLabs TTS API and return raw audio bytes (audio/mpeg).
    """
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY environment variable is not set")

    effective_voice_id = voice_id or LANGUAGE_VOICE_IDS.get(language, LANGUAGE_VOICE_IDS['en'])

    truncated_text = _truncate_at_sentence(text, MAX_CHARS)

    url = f"{ELEVENLABS_API_URL}/{effective_voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": truncated_text,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.70,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.content


def _truncate_at_sentence(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text

    truncated = text[:max_chars]

    for sep in ['. ', '! ', '? ', '.\n', '!\n', '?\n']:
        idx = truncated.rfind(sep)
        if idx > max_chars * 0.6:
            return truncated[:idx + 1].strip()

    last_space = truncated.rfind(' ')
    if last_space > max_chars * 0.8:
        return truncated[:last_space].strip()

    return truncated.strip()


def get_voice_id(language: str) -> str:
    return LANGUAGE_VOICE_IDS.get(language, LANGUAGE_VOICE_IDS['en'])
