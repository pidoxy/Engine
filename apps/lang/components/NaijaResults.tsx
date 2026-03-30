'use client';
// components/NaijaResults.tsx — Triage results screen in the target language

import { NaijaTriageResult, LanguageCode } from '../types';
import { LANGUAGES } from '../lib/languages';
import SpeakButton from './SpeakButton';
import BrandingFooter from './BrandingFooter';

interface NaijaResultsProps {
  result: NaijaTriageResult;
  language: LanguageCode;
  onReset: () => void;
}

export default function NaijaResults({ result, language, onReset }: NaijaResultsProps) {
  const lang = LANGUAGES[language];

  const riskColors = {
    high: {
      bg: 'bg-red-950/60',
      border: 'border-red-700/50',
      badge: 'bg-red-800/60 text-red-200',
      text: 'text-red-100',
      accent: '#ef4444',
    },
    moderate: {
      bg: 'bg-yellow-950/60',
      border: 'border-yellow-700/50',
      badge: 'bg-yellow-800/60 text-yellow-200',
      text: 'text-yellow-100',
      accent: '#f59e0b',
    },
    low: {
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-700/50',
      badge: 'bg-emerald-800/60 text-emerald-200',
      text: 'text-emerald-100',
      accent: '#10b981',
    },
  };

  const colors = riskColors[result.risk_level];

  return (
    <div className="min-h-screen bg-[#050d1f] flex flex-col" style={{
      background: 'radial-gradient(ellipse at 50% 0%, #0d1f3f 0%, #050d1f 60%)',
    }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">AidCare</h1>
            <p className="text-white/40 text-xs">{lang.assessmentLabel}</p>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold border"
          style={{
            color: lang.accentColor,
            borderColor: `${lang.accentColor}40`,
            backgroundColor: `${lang.accentColor}15`,
          }}
        >
          {lang.nativeName}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          {/* Risk Level + Summary Card */}
          <div
            className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}
            style={{ animation: 'fadeInUp 0.4s ease both' }}
          >
            {/* Listen to Summary button + Risk badge */}
            <div className="flex items-start justify-between mb-4 gap-3">
              <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${colors.badge}`}>
                {lang.urgencyLabel}: {result.urgency_level}
              </span>
              <SpeakButton
                text={result.summary_of_findings}
                language={language}
                size="md"
                label={lang.listenSummaryLabel}
                accentColor={colors.accent}
              />
            </div>

            <p className={`text-sm leading-relaxed ${colors.text}`}>
              {result.summary_of_findings}
            </p>

            {/* Identified symptoms */}
            {result.extracted_symptoms.length > 0 && (
              <div className="mt-4">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">
                  {lang.symptomsBadgeLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.extracted_symptoms.map((symptom, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/10"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          {result.recommended_actions_for_chw.length > 0 && (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
              style={{ animation: 'fadeInUp 0.4s ease both 0.1s' }}
            >
              <h3 className="text-white/80 font-semibold text-sm mb-4">{lang.actionsLabel}</h3>
              <ol className="space-y-3">
                {result.recommended_actions_for_chw.map((action, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: lang.accentColor + '40', color: lang.accentColor }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-white/70 text-sm leading-relaxed pt-0.5">{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
            style={{ animation: 'fadeInUp 0.4s ease both 0.2s' }}
          >
            {result.risk_level === 'high' && (
              <>
                <a
                  href="tel:112"
                  className="block w-full py-3 px-4 bg-red-600 text-white text-center rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  🚨 Call Emergency — 112
                </a>
                <button
                  onClick={() => window.open('https://www.google.com/maps/search/hospital+near+me', '_blank')}
                  className="block w-full py-3 px-4 bg-red-900/40 text-red-300 text-center rounded-xl font-semibold text-sm hover:bg-red-900/60 border border-red-700/40 transition-colors w-full"
                >
                  Find Nearest Hospital
                </button>
              </>
            )}
            {result.risk_level === 'moderate' && (
              <button
                onClick={() => window.open('https://www.google.com/maps/search/clinic+near+me', '_blank')}
                className="block w-full py-3 px-4 text-white text-center rounded-xl font-semibold text-sm transition-colors w-full"
                style={{ backgroundColor: lang.accentColor + 'CC' }}
              >
                Find a Nearby Clinic
              </button>
            )}
            {result.risk_level === 'low' && (
              <button
                onClick={() => window.open('https://www.nhs.uk/conditions/', '_blank')}
                className="block w-full py-3 px-4 text-white text-center rounded-xl font-semibold text-sm transition-colors w-full"
                style={{ backgroundColor: lang.accentColor + 'CC' }}
              >
                Learn More About Your Symptoms
              </button>
            )}
          </div>

          {/* Evidence note */}
          {result.evidence_based_notes && (
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs">{result.evidence_based_notes}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
            <p className="text-amber-300/60 text-xs">
              This assessment is for guidance only and is not a medical diagnosis. Always consult a qualified healthcare professional.
            </p>
          </div>

          {/* Restart */}
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white/70 border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
          >
            {lang.restartLabel}
          </button>
        </div>
      </main>

      <BrandingFooter />
    </div>
  );
}
