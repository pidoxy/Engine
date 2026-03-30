'use client';
// app/page.tsx — Root page orchestrator
// AidCare Naija Language App — UNDP Nigeria IC × Timbuktu Initiative
// International Mother Language Day, 21 February

import { useState } from 'react';
import { LanguageCode, NaijaPhase, NaijaTriageResult } from '../types';
import LanguageSelector from '../components/LanguageSelector';
import NaijaConversation from '../components/NaijaConversation';
import NaijaResults from '../components/NaijaResults';
import { stopCurrentAudio } from '../lib/tts';

export default function NaijaApp() {
  const [phase, setPhase] = useState<NaijaPhase>('language_select');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [triageResult, setTriageResult] = useState<NaijaTriageResult | null>(null);

  const handleLanguageSelect = (lang: LanguageCode) => {
    stopCurrentAudio(); // Stop any playing audio before starting new session
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

  if (phase === 'language_select') {
    return <LanguageSelector onSelect={handleLanguageSelect} />;
  }

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
      <NaijaResults
        result={triageResult}
        language={language}
        onReset={handleReset}
      />
    );
  }

  // Fallback — should not reach here
  return <LanguageSelector onSelect={handleLanguageSelect} />;
}
