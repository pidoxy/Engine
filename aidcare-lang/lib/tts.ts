'use client';
// lib/tts.ts — ElevenLabs TTS client utility
// Calls the backend TTS proxy to keep the API key server-side

import { LanguageCode } from '../types';
import { LANGUAGES } from './languages';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Singleton audio element to prevent overlapping playback
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
// true while a fetch is in-flight — any duplicate speakText() call is dropped
let isFetching = false;

export function stopCurrentAudio() {
  // Resetting isFetching here lets a manual SpeakButton click interrupt and restart
  isFetching = false;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

/**
 * Speak text via ElevenLabs TTS through the backend proxy.
 * Stops any currently-playing audio before starting new playback.
 *
 * @param text - Text to speak
 * @param languageCode - Language code for voice selection
 * @param onStart - Called when audio starts playing
 * @param onEnd - Called when audio ends or if an error occurs
 */
export async function speakText(
  text: string,
  languageCode: LanguageCode,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // If a fetch is already in-flight, drop this call — the first call wins
  if (isFetching) return;

  // Stop any currently-playing audio (manual interrupt via SpeakButton is allowed
  // because stopCurrentAudio() resets isFetching before we reach this point)
  stopCurrentAudio();

  const voiceId = LANGUAGES[languageCode]?.elevenLabsVoiceId || '';

  isFetching = true;
  try {
    const res = await fetch(`${API_BASE_URL}/tts/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        language: languageCode,
      }),
    });

    if (!res.ok) {
      isFetching = false;
      console.warn(`TTS request failed (${res.status}). Text will display only.`);
      onEnd?.();
      return;
    }

    const audioBlob = await res.blob();
    const objectUrl = URL.createObjectURL(audioBlob);
    currentObjectUrl = objectUrl;

    const audio = new Audio(objectUrl);
    currentAudio = audio;

    audio.onplay = () => {
      // Audio is actually playing now — release the lock so a manual
      // SpeakButton click can interrupt if the user wants to replay
      isFetching = false;
      onStart?.();
    };

    audio.onended = () => {
      isFetching = false;
      URL.revokeObjectURL(objectUrl);
      currentObjectUrl = null;
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      isFetching = false;
      URL.revokeObjectURL(objectUrl);
      currentObjectUrl = null;
      currentAudio = null;
      onEnd?.();
    };

    await audio.play();
  } catch (err) {
    isFetching = false;
    console.warn('TTS playback error (graceful fallback to text-only):', err);
    onEnd?.();
  }
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}
