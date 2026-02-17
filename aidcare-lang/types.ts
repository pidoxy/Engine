// types.ts — Shared TypeScript interfaces for the Naija language app

export type LanguageCode = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

export interface NaijaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isAudio?: boolean;
  shouldSpeak?: boolean;
}

export interface NaijaTriageResult {
  urgency_level: string;
  summary_of_findings: string;
  recommended_actions_for_chw: string[];
  extracted_symptoms: string[];
  evidence_based_notes?: string;
  risk_level: 'high' | 'moderate' | 'low';
  language: string;
}

export type NaijaPhase = 'language_select' | 'conversation' | 'results';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'recorded';
