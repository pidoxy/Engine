// pages/triage.tsx — Multilingual triage, embedded in the core AidCare web app.
// Ported from apps/lang (now retired). Served at /triage on the single product
// domain (one-product-feel, PRD §3.1, §13.1). All backend calls go through
// services/api (/api/v1/naija/*, /api/v1/tts) — the Engine is never called directly.
import { useState } from 'react';
import type { LanguageCode, NaijaPhase, NaijaTriageResult } from '@/lib/triage/types';
import LanguageSelector from '@/components/triage/LanguageSelector';
import NaijaConversation from '@/components/triage/NaijaConversation';
import NaijaResults from '@/components/triage/NaijaResults';
import { stopCurrentAudio } from '@/lib/triage/tts';

export default function TriagePage() {
  const [phase, setPhase] = useState<NaijaPhase>('language_select');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [triageResult, setTriageResult] = useState<NaijaTriageResult | null>(null);

  const handleLanguageSelect = (lang: LanguageCode) => {
    stopCurrentAudio();
    setLanguage(lang);
    setTriageResult(null);
    setPhase('conversation');
  };

  const handleConversationComplete = (result: NaijaTriageResult) => {
    setTriageResult(result);
    setPhase('results');
  };

  const handleCancel = () => {
    stopCurrentAudio();
    setPhase('language_select');
    setTriageResult(null);
  };

  const handleReset = () => {
    stopCurrentAudio();
    setPhase('language_select');
    setTriageResult(null);
  };

  if (phase === 'conversation') {
    return (
      <NaijaConversation
        language={language}
        onCancel={handleCancel}
        onComplete={handleConversationComplete}
      />
    );
  }

  if (phase === 'results' && triageResult) {
    return (
      <NaijaResults result={triageResult} language={language} onReset={handleReset} />
    );
  }

  return <LanguageSelector onSelect={handleLanguageSelect} />;
}
