# aidcare_pipeline/tts_service.py
# TTS service: Azure Neural voices for Nigerian languages, OpenAI as fallback

import os
import httpx
from typing import Optional
from openai import AsyncOpenAI

# Azure Neural voices — purpose-built for Nigerian languages with tonal accuracy
AZURE_VOICE_MAP: dict[str, tuple[str, str]] = {
    # (voice_name, language_code_for_ssml)
    'yo':  ('yo-NG-AdetutuNeural', 'yo-NG'),
    'ha':  ('ha-NG-AhmadNeural',   'ha-NG'),
    'ig':  ('ig-NG-EzinneNeural',  'ig-NG'),
    'pcm': ('en-NG-AbeoNeural',    'en-NG'),
}

# OpenAI voices — fallback for all languages, primary for English
OPENAI_VOICE_MAP: dict[str, str] = {
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
    Generate speech audio. Uses Azure Neural TTS for Nigerian languages (yo, ha, ig, pcm)
    with OpenAI TTS as fallback. English always uses OpenAI.
    """
    truncated_text = _truncate_at_sentence(text, MAX_CHARS)

    # English goes straight to OpenAI
    if language == 'en':
        return await _openai_tts(truncated_text, language)

    # Nigerian languages: try Azure first, fall back to OpenAI
    if language in AZURE_VOICE_MAP:
        azure_key = os.environ.get("AZURE_TTS_KEY")
        azure_region = os.environ.get("AZURE_TTS_REGION")
        if azure_key and azure_region:
            try:
                return await _azure_tts(truncated_text, language, azure_key, azure_region)
            except Exception:
                pass  # fall through to OpenAI

    return await _openai_tts(truncated_text, language)


async def _azure_tts(text: str, language: str, api_key: str, region: str) -> bytes:
    voice_name, lang_code = AZURE_VOICE_MAP[language]
    ssml = (
        f"<speak version='1.0' xml:lang='{lang_code}'>"
        f"<voice name='{voice_name}'>{text}</voice>"
        f"</speak>"
    )
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": api_key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, content=ssml.encode("utf-8"))
        response.raise_for_status()
        return response.content


async def _openai_tts(text: str, language: str) -> bytes:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    voice = OPENAI_VOICE_MAP.get(language, 'nova')
    client = AsyncOpenAI(api_key=api_key)
    response = await client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
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
    return AZURE_VOICE_MAP.get(language, ('nova', ''))[0] if language in AZURE_VOICE_MAP else OPENAI_VOICE_MAP.get(language, 'nova')
