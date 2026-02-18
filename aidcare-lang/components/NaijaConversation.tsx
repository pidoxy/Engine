'use client';
// components/NaijaConversation.tsx — Conversation UI in the chosen language with live TTS

import { useState, useEffect, useRef } from 'react';
import { LanguageCode, NaijaMessage, RecordingState } from '../types';
import { LANGUAGES } from '../lib/languages';
import { continueConversation, processText, parseTriageResult } from '../lib/api';
import { speakText } from '../lib/tts';
import SpeakButton from './SpeakButton';
import type { NaijaTriageResult } from '../types';

interface NaijaConversationProps {
  language: LanguageCode;
  onCancel: () => void;
  onComplete: (result: NaijaTriageResult) => void;
}

export default function NaijaConversation({ language, onCancel, onComplete }: NaijaConversationProps) {
  const lang = LANGUAGES[language];
  const [messages, setMessages] = useState<NaijaMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio recording
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Tracks the index of the last message spoken — prevents double-playback
  // when React re-renders (e.g. from setIsSpeaking) re-trigger the effect
  const spokenIndexRef = useRef<number>(-1);

  // Initial greeting
  useEffect(() => {
    const greeting: NaijaMessage = {
      role: 'assistant',
      content: lang.greeting,
      shouldSpeak: true,
    };
    setMessages([greeting]);
  }, [lang.greeting]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-play TTS for new assistant messages — fires once per message index
  useEffect(() => {
    const lastIndex = messages.length - 1;
    const lastMsg = messages[lastIndex];
    if (
      lastMsg?.role === 'assistant' &&
      lastMsg.shouldSpeak &&
      lastIndex > spokenIndexRef.current   // guard: only speak each message once
    ) {
      spokenIndexRef.current = lastIndex;
      speakText(lastMsg.content, language, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  }, [messages, language]);

  const buildConversationHistory = (msgs: NaijaMessage[]) =>
    msgs
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'PATIENT' : 'YOU'}: ${m.content}`)
      .join('\n');

  // ---------------------------------------------------------------------------
  // Send text message
  // ---------------------------------------------------------------------------

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    const newMessages: NaijaMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setConversationContext(prev => [...prev, userMessage]);

    await handleContinueConversation(userMessage, newMessages);
    setLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Continue conversation with Gemini
  // ---------------------------------------------------------------------------

  const handleContinueConversation = async (userMessage: string, currentMessages: NaijaMessage[]) => {
    const history = buildConversationHistory(currentMessages);

    try {
      const data = await continueConversation(history, userMessage, language);

      const assistantMsg: NaijaMessage = {
        role: 'assistant',
        content: data.response || lang.placeholder,
        shouldSpeak: true,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.should_auto_complete || data.conversation_complete) {
        setAutoCompleting(true);
        setTimeout(() => completeAssessment(), 3000);
      }
    } catch (err) {
      console.error('Conversation error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang.placeholder,
        shouldSpeak: false,
      }]);
    }
  };

  // ---------------------------------------------------------------------------
  // Complete assessment (final triage)
  // ---------------------------------------------------------------------------

  const completeAssessment = async () => {
    setLoading(true);
    try {
      const allText = conversationContext.join(' ');
      const data = await processText(allText, language);
      const result = parseTriageResult(data, language);
      onComplete(result);
    } catch (err) {
      console.error('Triage error:', err);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Unable to complete assessment. Please check your connection and try again.',
        shouldSpeak: false,
      }]);
      setAutoCompleting(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Audio recording
  // ---------------------------------------------------------------------------

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setRecordingState('recorded');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Unable to access microphone. Please check your browser permissions.',
        shouldSpeak: false,
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordingState('idle');
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    setRecordingState('processing');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', language);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/naija/process_audio/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Audio processing failed');

      const data = await res.json();
      // The audio endpoint returns full triage if it has enough context,
      // or just transcript for continuing the conversation
      const transcribedText = data.input_transcript || data.transcript || '';

      if (transcribedText) {
        const newMessages: NaijaMessage[] = [
          ...messages,
          { role: 'user', content: transcribedText, isAudio: true },
        ];
        setMessages(newMessages);
        setConversationContext(prev => [...prev, transcribedText]);

        if (data.triage_recommendation) {
          // Full triage result came back
          const result = parseTriageResult(data, language);
          onComplete(result);
          return;
        }

        await handleContinueConversation(transcribedText, newMessages);
      }

      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingState('idle');
      audioChunksRef.current = [];
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Having trouble processing your audio. Please try again or type your message.',
        shouldSpeak: false,
      }]);
      setRecordingState('recorded');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

        {/* Language badge */}
        <div className="flex items-center gap-2">
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
          {isSpeaking && (
            <span className="text-white/40 text-xs animate-pulse">
              {lang.speakingLabel}
            </span>
          )}
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
              style={{ animation: 'fadeInUp 0.3s ease both' }}
            >
              {message.role === 'assistant' && (
                <SpeakButton
                  text={message.content}
                  language={language}
                  accentColor={lang.accentColor}
                />
              )}
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : message.role === 'system'
                    ? 'bg-red-900/40 text-red-300 border border-red-800/50'
                    : 'naija-bubble-assistant text-white rounded-bl-sm'
                  }
                `}
              >
                {message.content}
                {message.isAudio && (
                  <span className="block text-xs opacity-50 mt-1">🎙 Voice message</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="naija-bubble-assistant rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <span className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-white/50 rounded-full animate-bounce" style={{ height: '50%', animationDelay: '0ms' }} />
                  <span className="w-1 bg-white/50 rounded-full animate-bounce" style={{ height: '80%', animationDelay: '150ms' }} />
                  <span className="w-1 bg-white/50 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '300ms' }} />
                </span>
                <span className="text-white/50 text-xs">{lang.thinkingLabel}</span>
              </div>
            </div>
          )}

          {autoCompleting && (
            <div className="flex justify-center">
              <div className="px-4 py-2 rounded-full border text-xs text-white/60 border-white/20 animate-pulse">
                ✓ {lang.completeLabel}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <div className="border-t border-white/10 px-4 py-4 bg-[#050d1f]/80 backdrop-blur">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Idle: text input + mic */}
          {recordingState === 'idle' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                placeholder={lang.placeholder}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputText.trim()}
                className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: lang.accentColor }}
              >
                {lang.sendLabel}
              </button>
              <button
                onClick={startRecording}
                disabled={loading}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition-all disabled:opacity-40"
                title={lang.listeningLabel}
              >
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Recording */}
          {recordingState === 'recording' && (
            <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-300 font-semibold text-sm">{lang.listeningLabel}</span>
                <span className="text-red-400/70 text-sm">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelRecording} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/15 transition-colors">
                  Cancel
                </button>
                <button onClick={stopRecording} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Recorded — ready to send */}
          {recordingState === 'recorded' && audioBlob && (
            <div className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span className="text-white/70 text-sm">Recorded ({formatTime(recordingTime)})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelRecording} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/15 transition-colors">
                  Record Again
                </button>
                <button
                  onClick={sendAudioMessage}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
                  style={{ backgroundColor: lang.accentColor }}
                >
                  {lang.sendLabel}
                </button>
              </div>
            </div>
          )}

          {/* Processing audio */}
          {recordingState === 'processing' && (
            <div className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 flex items-center gap-3">
              <div className="spinner-white" />
              <span className="text-white/60 text-sm">{lang.thinkingLabel}</span>
            </div>
          )}

          {/* Complete Assessment button */}
          {messages.length > 3 && !loading && !autoCompleting && recordingState === 'idle' && (
            <button
              onClick={completeAssessment}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white/90 border border-white/20 bg-white/8 hover:bg-white/12 transition-all"
            >
              {lang.completeLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
