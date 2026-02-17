// lib/api.ts — Typed API wrappers for backend calls
// All calls go to the shared aidcare-backend server

import { LanguageCode, NaijaTriageResult } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Multilingual conversation continuation
// ---------------------------------------------------------------------------

export async function continueConversation(
  conversationHistory: string,
  latestMessage: string,
  language: LanguageCode
): Promise<{
  response: string;
  language: string;
  conversation_complete: boolean;
  should_auto_complete: boolean;
}> {
  const res = await fetch(`${API_BASE_URL}/naija/continue_conversation/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_history: conversationHistory,
      latest_message: latestMessage,
      language,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Conversation API error ${res.status}: ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Multilingual triage from text transcript
// ---------------------------------------------------------------------------

export async function processText(
  transcriptText: string,
  language: LanguageCode
): Promise<{
  mode: string;
  language: string;
  input_transcript: string;
  extracted_symptoms: string[];
  triage_recommendation: {
    summary_of_findings: string;
    recommended_actions_for_chw: string[];
    urgency_level: string;
    key_guideline_references?: string[];
    important_notes_for_chw?: string[];
    evidence_based_notes?: string;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/naija/process_text/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript_text: transcriptText,
      language,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Triage API error ${res.status}: ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Multilingual audio triage
// Returns transcript for display, then same triage_recommendation structure
// ---------------------------------------------------------------------------

export async function processAudio(
  audioBlob: Blob,
  language: LanguageCode
): Promise<{
  transcript?: string;
  triage_recommendation?: {
    summary_of_findings: string;
    recommended_actions_for_chw: string[];
    urgency_level: string;
  };
  extracted_symptoms?: string[];
  language?: string;
  // Transcription-only response (when used as interim step)
  transcript_text?: string;
}> {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.webm');
  formData.append('language', language);

  const res = await fetch(`${API_BASE_URL}/naija/process_audio/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Audio API error ${res.status}: ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Parse raw triage API response into a typed NaijaTriageResult
// ---------------------------------------------------------------------------

export function parseTriageResult(
  data: Awaited<ReturnType<typeof processText>>,
  language: LanguageCode
): NaijaTriageResult {
  const rec = data.triage_recommendation;
  const urgencyLower = (rec.urgency_level || '').toLowerCase();

  let risk_level: 'high' | 'moderate' | 'low' = 'moderate';
  if (
    urgencyLower.includes('emergency') ||
    urgencyLower.includes('immediate') ||
    urgencyLower.includes('gaggawa') ||       // Hausa
    urgencyLower.includes('pàjáwìrì') ||      // Yoruba
    urgencyLower.includes('ọsọ') ||           // Igbo
    urgencyLower.includes('emergency')        // Pidgin
  ) {
    risk_level = 'high';
  } else if (
    urgencyLower.includes('urgent') ||
    urgencyLower.includes('refer') ||
    urgencyLower.includes('miƙa') ||          // Hausa
    urgencyLower.includes('ìtọ́kasí') ||       // Yoruba
    urgencyLower.includes('nnyefe') ||        // Igbo
    urgencyLower.includes('hospital')
  ) {
    risk_level = 'moderate';
  } else if (
    urgencyLower.includes('routine') ||
    urgencyLower.includes('monitor') ||
    urgencyLower.includes('home') ||
    urgencyLower.includes('yau da kullum') || // Hausa
    urgencyLower.includes('àsìkò') ||         // Yoruba
    urgencyLower.includes('oge ya')           // Igbo
  ) {
    risk_level = 'low';
  }

  return {
    urgency_level: rec.urgency_level,
    summary_of_findings: rec.summary_of_findings,
    recommended_actions_for_chw: rec.recommended_actions_for_chw || [],
    extracted_symptoms: data.extracted_symptoms || [],
    evidence_based_notes: rec.evidence_based_notes,
    risk_level,
    language,
  };
}
