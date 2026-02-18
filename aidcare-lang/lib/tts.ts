'use client';
// lib/tts.ts — ElevenLabs TTS client utility
// Calls the backend TTS proxy to keep the API key server-side

import { LanguageCode } from '../types';
import { LANGUAGES } from './languages';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Singleton audio element to prevent overlapping playback
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
// AbortController cancels any in-flight fetch when a new speakText() call arrives
// This prevents two concurrent fetches from both completing and playing audio
let currentAbortController: AbortController | null = null;

export function stopCurrentAudio() {
  // Abort any in-flight fetch first — this is the root cause of double playback
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
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
  // Stop anything currently playing — also aborts any in-flight fetch
  stopCurrentAudio();

  const voiceId = LANGUAGES[languageCode]?.elevenLabsVoiceId || '';

  // Create a new AbortController for this fetch — stored so stopCurrentAudio() can cancel it
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    const res = await fetch(`${API_BASE_URL}/tts/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        language: languageCode,
      }),
      signal: controller.signal,  // ties this fetch to the abort controller
    });

    // Fetch completed — clear the controller reference
    currentAbortController = null;

    if (!res.ok) {
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
      onStart?.();
    };

    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
      currentObjectUrl = null;
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      currentObjectUrl = null;
      currentAudio = null;
      onEnd?.();
    };

    await audio.play();
  } catch (err) {
    // AbortError means a newer speakText() call cancelled this one — not an error
    if (err instanceof Error && err.name === 'AbortError') return;
    console.warn('TTS playback error (graceful fallback to text-only):', err);
    onEnd?.();
  }
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}
