'use client';
// components/LanguageSelector.tsx — Premium language selection landing screen
// UNDP Nigeria IC × Timbuktu Initiative

import { LanguageCode } from '../types';
import { LANGUAGES, LANGUAGE_ORDER } from '../lib/languages';
import BrandingHeader from './BrandingHeader';
import BrandingFooter from './BrandingFooter';

interface LanguageCard {
  code: LanguageCode;
  animationDelay: number;
}

interface LanguageSelectorProps {
  onSelect: (language: LanguageCode) => void;
}

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const cards: LanguageCard[] = LANGUAGE_ORDER.map((code, i) => ({
    code,
    animationDelay: i * 80,
  }));

  return (
    <div className="min-h-screen bg-[#050d1f] flex flex-col" style={{
      background: 'radial-gradient(ellipse at 50% 30%, #0d1f3f 0%, #050d1f 70%)',
    }}>
      <BrandingHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Headline */}
        <div className="text-center mb-12 max-w-2xl" style={{ animation: 'fadeInUp 0.6s ease both' }}>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3">
            AidCare · Medical Triage AI
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            Let AI Speak Your{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Mother Tongue
            </span>
          </h1>
          <p className="text-lg text-white/50 font-light">
            Bari AI ta yi magana da yaren uwa ku
          </p>
          <p className="mt-4 text-white/30 text-sm max-w-lg mx-auto">
            Select your language to begin a health assessment in the language you speak at home.
          </p>
        </div>

        {/* Language cards */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {cards.map(({ code, animationDelay }) => (
            <LanguageCardItem
              key={code}
              code={code}
              animationDelay={animationDelay}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Subtitle */}
        <p className="mt-8 text-white/25 text-xs text-center max-w-md">
          Hausa · Yorùbá · Igbo · Naija Pidgin · English
        </p>
      </main>

      <BrandingFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual language card
// ---------------------------------------------------------------------------

interface LanguageCardItemProps {
  code: LanguageCode;
  animationDelay: number;
  onSelect: (language: LanguageCode) => void;
}

function LanguageCardItem({ code, animationDelay, onSelect }: LanguageCardItemProps) {
  const lang = LANGUAGES[code];

  return (
    <button
      onClick={() => onSelect(code)}
      className={`
        naija-card relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left
        bg-gradient-to-br ${lang.cardGradient}
        border border-white/10
        group
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
        minHeight: '140px',
      }}
    >
      {/* Decorative large character in background */}
      <span
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        style={{
          fontSize: '7rem',
          fontWeight: 900,
          color: lang.accentColor,
          opacity: 0.07,
          lineHeight: 1,
          fontFamily: 'serif',
        }}
      >
        {lang.decorativeChar}
      </span>

      {/* Subtle radial glow on hover */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${lang.accentColor}20, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* English name */}
          <p className="text-white/60 text-xs font-medium tracking-wide uppercase">
            {lang.name}
          </p>
          {/* Native name — large, accent-colored */}
          <p
            className="text-xl sm:text-2xl font-bold mt-1 leading-tight"
            style={{ color: lang.accentColor }}
          >
            {lang.nativeName}
          </p>
          {/* Native script (Arabic for Hausa, etc.) */}
          {lang.nativeScript !== lang.nativeName && (
            <p className="text-white/40 text-sm mt-0.5">{lang.nativeScript}</p>
          )}
        </div>

        {/* Bottom label */}
        <p className="text-white/30 text-xs mt-3 font-medium">
          {lang.speakCardLabel} →
        </p>
      </div>

      {/* Hover border glow */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${lang.accentColor}60` }}
      />
    </button>
  );
}
