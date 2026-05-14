# aidcare_pipeline/tts_service.py
# OpenAI TTS service for Nigerian language audio generation

import os
from typing import Optional
from openai import AsyncOpenAI

# OpenAI voice per language — all voices support multilingual output
LANGUAGE_VOICE_MAP: dict[str, str] = {
    'en':  'nova',
    'ha':  'shimmer',
    'yo':  'nova',
    'ig':  'alloy',
    'pcm': 'echo',
}

MAX_CHARS = 4096


async def generate_speech(
    text: str,
    language: str,
    voice_id: Optional[str] = None
) -> bytes:
    """
    Call OpenAI TTS API and return raw audio bytes (audio/mpeg).
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    voice = voice_id if voice_id in ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer') \
        else LANGUAGE_VOICE_MAP.get(language, 'nova')

    truncated_text = _truncate_at_sentence(text, MAX_CHARS)

    client = AsyncOpenAI(api_key=api_key)
    response = await client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=truncated_text,
        response_format="mp3",
    )
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
    return LANGUAGE_VOICE_MAP.get(language, 'nova')
