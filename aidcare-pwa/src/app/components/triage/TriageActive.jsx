"use client";

import { useState, useEffect, useRef } from 'react';

export default function TriageActive({ onRecordingComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionState, setPermissionState] = useState('prompt');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    checkMicPermission();
    return () => stopRecording(true);
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const checkMicPermission = async () => {
    try {
      const result = await navigator.permissions?.query({ name: 'microphone' });
      setPermissionState(result?.state || 'prompt');
    } catch {
      setPermissionState('prompt');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete?.(audioBlob, duration);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPermissionState('granted');
    } catch {
      setPermissionState('denied');
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    if (cancel) onCancel?.();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Start Screen
  if (!isRecording) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Voice Triage</h1>
          <p className="text-lg text-slate-500 font-medium">Describe the patient's symptoms clearly</p>
        </div>

        <div className="bg-white rounded-3xl shadow-strong p-10 text-center relative overflow-hidden ring-1 ring-slate-200/50">
          {/* Decorational background blob */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-50/50 to-transparent pointer-events-none" />

          {/* Mic Icon */}
          <div className="relative inline-flex mb-10 group">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl group-hover:bg-cyan-400/30 transition-all duration-500" />
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/40 relative z-10 transform ml-0 group-hover:scale-105 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-5xl">mic</span>
            </div>

            {permissionState === 'granted' && (
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white shadow-sm z-20">
                <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to Record</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
            Press the microphone button below to begin your clinical assessment recording.
          </p>

          <button
            onClick={startRecording}
            disabled={permissionState === 'denied'}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">mic</span>
            Start Recording
          </button>

          {permissionState === 'denied' && (
            <p className="mt-4 text-sm font-medium text-rose-600 bg-rose-50 py-2 px-3 rounded-lg inline-block">
              Microphone access denied. Please check settings.
            </p>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="text-cyan-700 hover:text-cyan-800 font-semibold text-sm hover:underline decoration-2 underline-offset-4 transition-all"
            >
              Or enter symptoms manually →
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: 'person', text: 'State Age & Gender', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: 'schedule', text: 'Symptom Duration', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: 'warning', text: 'Danger Signs', color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((tip, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 border border-white/50 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${tip.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-outlined ${tip.color}`}>{tip.icon}</span>
              </div>
              <span className="text-sm font-medium text-slate-700">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Recording Screen
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-3xl shadow-strong p-10 ring-1 ring-slate-200/50">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recording</h2>
            <p className="text-slate-500 font-medium">Speak clearly provided details</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-700 text-sm font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Waveform Visualization (Simulated) */}
        <div className={`flex items-center justify-center gap-1.5 h-32 mb-12 ${isPaused ? 'opacity-50' : ''}`}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-cyan-500 transition-all duration-150"
              style={{
                height: isPaused ? '20%' : `${Math.max(20, Math.random() * 100)}%`,
                opacity: isPaused ? 0.5 : Math.random() * 0.5 + 0.5
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center mb-12">
          <div className="text-6xl font-black text-slate-900 tracking-tight font-display tabular-nums">
            {formatTime(duration)}
          </div>
          <p className="text-slate-400 font-medium mt-2 uppercase tracking-widest text-xs">Recording Duration</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => stopRecording(true)}
            className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
            title="Cancel"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          <button
            onClick={() => stopRecording(false)}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 shadow-xl shadow-rose-500/30 text-white flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 hover:shadow-rose-500/40"
            title="Stop Recording"
          >
            <span className="material-symbols-outlined text-4xl">stop</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-5 bg-cyan-50/50 border border-cyan-100 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-cyan-600 text-sm">lightbulb</span>
            </div>
            <div>
              <p className="text-sm font-bold text-cyan-900 mb-1">Observation Tips</p>
              <p className="text-sm text-cyan-800/80 leading-relaxed">
                Include patient demographics, main complaints, symptom timeline, and any observed danger signs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
