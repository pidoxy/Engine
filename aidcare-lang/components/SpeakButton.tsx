'use client';
// components/SpeakButton.tsx — Manual TTS replay button

import { useState } from 'react';
import { LanguageCode } from '../types';
import { speakText } from '../lib/tts';

interface SpeakButtonProps {
  text: string;
  language: LanguageCode;
  size?: 'sm' | 'md';
  label?: string;
  accentColor?: string;
}

export default function SpeakButton({
  text,
  language,
  size = 'sm',
  label,
  accentColor,
}: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    await speakText(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const sizeClasses = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : 'w-10 h-10 text-sm px-3 gap-2';

  return (
    <button
      onClick={handleSpeak}
      disabled={isSpeaking}
      title={label || 'Listen'}
      className={`
        flex items-center justify-center rounded-full
        transition-all duration-200
        ${isSpeaking
          ? 'bg-white/20 ring-2 ring-white/30 scale-110'
          : 'bg-white/10 hover:bg-white/20 hover:scale-105'
        }
        ${sizeClasses}
        disabled:cursor-not-allowed
      `}
      style={accentColor && isSpeaking ? { boxShadow: `0 0 12px ${accentColor}60` } : {}}
    >
      {isSpeaking ? (
        /* Sound wave animation */
        <span className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]" style={{ height: '40%' }} />
          <span className="w-0.5 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.1s]" style={{ height: '80%' }} />
          <span className="w-0.5 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.2s]" style={{ height: '60%' }} />
          <span className="w-0.5 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.15s]" style={{ height: '100%' }} />
          <span className="w-0.5 bg-white rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.05s]" style={{ height: '50%' }} />
        </span>
      ) : (
        /* Speaker icon */
        <svg className="w-3.5 h-3.5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      )}
      {label && size === 'md' && (
        <span className="text-white/80 font-medium">{label}</span>
      )}
    </button>
  );
}
