'use client';
// AidCare Copilot — Live Scribe Page (THE key demo page)

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import { getSessionDoctor, getSessionShift } from '../../../lib/session';
import { transcribeAndScribe, saveConsultation, getBurnoutScore } from '../../../lib/api';
import { ScribeResult, Language, BurnoutDetail } from '../../../types';

type RecordState = 'idle' | 'recording' | 'processing' | 'done';

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en',  label: 'English'  },
  { code: 'ha',  label: 'Hausa'    },
  { code: 'yo',  label: 'Yorùbá'   },
  { code: 'ig',  label: 'Igbo'     },
  { code: 'pcm', label: 'Pidgin'   },
];

const COMPLEXITY_COLORS = ['', 'text-green-600', 'text-green-500', 'text-amber-500', 'text-orange-500', 'text-red-600'];
const COMPLEXITY_LABELS = ['', 'Routine', 'Mild', 'Moderate', 'Complex', 'Critical'];

export default function ScribePage() {
  const router = useRouter();

  // ── session ─────────────────────────────────────────────────────────────
  const doctor = getSessionDoctor();
  const shift  = getSessionShift();

  // ── state ────────────────────────────────────────────────────────────────
  const [recordState,  setRecordState]  = useState<RecordState>('idle');
  const [patientRef,   setPatientRef]   = useState('');
  const [language,     setLanguage]     = useState<Language>('en');
  const [timer,        setTimer]        = useState(0);
  const [result,       setResult]       = useState<ScribeResult | null>(null);
  const [editedSoap,   setEditedSoap]   = useState<ScribeResult['soap_note'] | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [savedId,      setSavedId]      = useState('');
  const [error,        setError]        = useState('');
  const [burnout,      setBurnout]      = useState<BurnoutDetail | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // ── refs ─────────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  // ── redirect if no session ───────────────────────────────────────────────
  useEffect(() => {
    if (!doctor || !shift) { router.replace('/doctor'); }
  }, [doctor, shift, router]);

  // ── fetch initial burnout score ──────────────────────────────────────────
  useEffect(() => {
    if (!doctor) return;
    getBurnoutScore(doctor.doctor_id)
      .then(setBurnout)
      .catch(() => {/* non-critical */});
  }, [doctor]);

  // ── cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── timer ────────────────────────────────────────────────────────────────
  function startTimer() {
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ── recording ────────────────────────────────────────────────────────────
  async function startRecording() {
    setError('');
    setResult(null);
    setEditedSoap(null);
    setSavedId('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      recorder.start(250); // collect chunks every 250ms
      setRecordState('recording');
      startTimer();
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  }

  function stopRecording() {
    stopTimer();
    setRecordState('processing');
    mediaRecorderRef.current?.stop();
  }

  // ── process audio ─────────────────────────────────────────────────────────
  const processAudio = useCallback(async (audioBlob: Blob) => {
    if (!doctor) return;
    setError('');
    try {
      const scribeResult = await transcribeAndScribe(
        audioBlob,
        doctor.doctor_id,
        patientRef || 'Unknown patient',
        language,
      );
      setResult(scribeResult);
      setEditedSoap({ ...scribeResult.soap_note });
      setRecordState('done');

      // Refresh burnout after new scribe (score updated when saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      setRecordState('idle');
    }
  }, [doctor, patientRef, language]);

  // ── save consultation ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!doctor || !shift || !result || !editedSoap) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveConsultation({
        doctorUuid:      doctor.doctor_id,
        shiftUuid:       shift.shift_id,
        patientRef:      patientRef || 'Unknown patient',
        transcript:      result.transcript,
        soapNote:        editedSoap,
        patientSummary:  result.patient_summary,
        complexityScore: result.complexity_score,
        flags:           result.flags,
        language,
      });
      setSavedId(saved.consultation_id);
      // Update burnout badge
      if (saved.burnout_score) {
        setBurnout(prev => prev
          ? { ...prev, cognitive_load_score: saved.burnout_score.cls, status: saved.burnout_score.status as 'green' | 'amber' | 'red' }
          : null
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── reset for new patient ──────────────────────────────────────────────────
  function handleNewPatient() {
    setRecordState('idle');
    setResult(null);
    setEditedSoap(null);
    setSavedId('');
    setError('');
    setTimer(0);
    setPatientRef('');
  }

  // ── format timer ─────────────────────────────────────────────────────────
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!doctor || !shift) return null;

  const cls    = burnout?.cognitive_load_score;
  const status = burnout?.status ?? 'green';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <NavBar cls={cls} clsStatus={status} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Patient Ref + Language */}
        {recordState !== 'done' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Patient Details</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Patient Reference</label>
                <input
                  type="text"
                  value={patientRef}
                  onChange={e => setPatientRef(e.target.value)}
                  placeholder="e.g. Bed 4A, Mr. Johnson..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0066CC]"
                  disabled={recordState === 'recording' || recordState === 'processing'}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as Language)}
                  disabled={recordState === 'recording' || recordState === 'processing'}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0066CC] bg-white"
                >
                  {LANG_OPTIONS.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Recording area */}
        {recordState === 'idle' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Press record, speak naturally with your patient.</p>
              <p className="text-gray-400 text-xs mt-1">AI will transcribe and generate a SOAP note.</p>
            </div>
            <button
              onClick={startRecording}
              className="w-24 h-24 bg-[#DC2626] rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
              aria-label="Start recording"
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/>
              </svg>
            </button>
            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Tap to record</p>
          </div>
        )}

        {recordState === 'recording' && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-600 text-sm font-semibold">RECORDING</span>
            </div>
            <button
              onClick={stopRecording}
              className="w-24 h-24 bg-[#DC2626] rounded-full pulse-record flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <div className="w-8 h-8 bg-white rounded-sm" />
            </button>
            <span className="text-2xl font-mono text-gray-700">{formatTime(timer)}</span>
            <p className="text-xs text-gray-400">Tap square to stop</p>
          </div>
        )}

        {recordState === 'processing' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-[#0066CC] border-t-transparent rounded-full spinner" />
            <p className="text-gray-600 text-sm font-medium">Transcribing &amp; generating SOAP note…</p>
            <p className="text-gray-400 text-xs">This takes 10–20 seconds</p>
          </div>
        )}

        {/* Result */}
        {recordState === 'done' && result && editedSoap && (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs text-gray-500 block">Patient</span>
                  <span className="font-semibold text-gray-900">{patientRef || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Complexity badge */}
                  <span className={`text-sm font-bold ${COMPLEXITY_COLORS[result.complexity_score]}`}>
                    {'★'.repeat(result.complexity_score)}{'☆'.repeat(5 - result.complexity_score)} {result.complexity_score}/5 · {COMPLEXITY_LABELS[result.complexity_score]}
                  </span>
                  {/* Flags */}
                  {result.flags.map(flag => (
                    <span key={flag} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                      🚨 {flag}
                    </span>
                  ))}
                </div>
              </div>
              {result.patient_summary && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">{result.patient_summary}</p>
              )}
            </div>

            {/* Transcript (collapsible) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowTranscript(v => !v)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-semibold text-gray-700">Transcript</span>
                <span className="text-xs text-gray-400">{showTranscript ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showTranscript && (
                <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {result.transcript}
                </div>
              )}
            </div>

            {/* SOAP Note */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">SOAP Note <span className="text-xs font-normal text-gray-400">(tap to edit)</span></h2>
              <div className="space-y-4">
                {(
                  [
                    { key: 'subjective' as const, label: 'S — Subjective', hint: "Patient's reported symptoms" },
                    { key: 'objective'  as const, label: 'O — Objective',   hint: 'Examination findings, vitals' },
                    { key: 'assessment' as const, label: 'A — Assessment',  hint: 'Diagnosis / differential' },
                    { key: 'plan'       as const, label: 'P — Plan',        hint: 'Medications, referrals, follow-up' },
                  ]
                ).map(({ key, label, hint }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-[#0066CC] block mb-1">{label}</label>
                    <textarea
                      value={editedSoap[key]}
                      onChange={e => setEditedSoap(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                      rows={3}
                      placeholder={hint}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#0066CC] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            {/* Saved confirmation */}
            {savedId && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-green-700 text-sm font-medium">✅ Saved to your shift!</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!savedId ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#0066CC] text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-[#0052a3] transition-colors"
                >
                  {saving ? 'Saving…' : '💾 Save to My Shift'}
                </button>
              ) : null}
              <button
                onClick={handleNewPatient}
                className={`${savedId ? 'flex-1' : 'w-auto px-5'} bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors`}
              >
                🎙️ New Patient
              </button>
            </div>
          </>
        )}

        {/* Error (idle/processing) */}
        {recordState !== 'done' && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Quick tip */}
        {recordState === 'idle' && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-semibold mb-1">💡 Pro tip</p>
            <p className="text-xs text-blue-600">
              Speak naturally — include patient complaints, vitals you measured, your assessment, and your plan.
              AI will structure it into SOAP format automatically.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
