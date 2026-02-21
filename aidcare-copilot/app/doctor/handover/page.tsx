'use client';
// AidCare Copilot — Handover Report Page

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import { getSessionDoctor, getSessionShift, clearSessionShift } from '../../../lib/session';
import { generateHandover, getBurnoutScore } from '../../../lib/api';
import { HandoverReport, BurnoutDetail } from '../../../types';

export default function HandoverPage() {
  const router = useRouter();
  const doctor = getSessionDoctor();
  const shift  = getSessionShift();

  const [report,       setReport]       = useState<HandoverReport | null>(null);
  const [generating,   setGenerating]   = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [error,        setError]        = useState('');
  const [copied,       setCopied]       = useState(false);
  const [burnout,      setBurnout]      = useState<BurnoutDetail | null>(null);
  const [endingShift,  setEndingShift]  = useState(false);

  useEffect(() => {
    if (!doctor || !shift) { router.replace('/doctor'); return; }
    getBurnoutScore(doctor.doctor_id).then(setBurnout).catch(() => {});
  }, [doctor, shift, router]);

  async function handleGenerate() {
    if (!doctor || !shift) return;
    setGenerating(true);
    setError('');
    try {
      const r = await generateHandover(doctor.doctor_id, shift.shift_id, handoverNotes);
      setReport(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate handover report.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.plain_text_report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not supported */
    }
  }

  function handleEndShift() {
    clearSessionShift();
    router.replace('/doctor');
  }

  if (!doctor || !shift) return null;

  const cls    = burnout?.cognitive_load_score;
  const status = burnout?.status ?? 'green';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <NavBar cls={cls} clsStatus={status} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 mb-1">Shift Handover</h1>
          <p className="text-sm text-gray-500">
            AI will review all consultations from your shift and generate a prioritised handover report for the incoming team.
          </p>
        </div>

        {!report ? (
          <>
            {/* Additional notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Additional ward notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
                placeholder="Any ward-level concerns, staffing issues, equipment, pending results…"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#0066CC] resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-[#0066CC] text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-[#0052a3] transition-colors"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                  Generating handover report…
                </span>
              ) : '🔄 Generate Handover Report'}
            </button>
          </>
        ) : (
          <>
            {/* Report header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Handover Report</h2>
                <span className="text-xs text-gray-400">
                  Generated {new Date(report.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="font-bold text-gray-900">{report.shift_summary.patients_seen}</div>
                  <div className="text-xs text-gray-500">Patients seen</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="font-bold text-gray-900">{report.shift_summary.avg_complexity.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Avg complexity</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="font-bold text-red-600">{report.critical_patients.length}</div>
                  <div className="text-xs text-gray-500">Critical</div>
                </div>
              </div>
            </div>

            {/* Critical patients */}
            {report.critical_patients.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-red-600 mb-3">🔴 Critical Patients ({report.critical_patients.length})</h3>
                <div className="space-y-4">
                  {report.critical_patients.map((p, i) => (
                    <div key={i} className="border-l-4 border-red-400 pl-3">
                      <div className="font-semibold text-gray-900 text-sm">{p.patient_ref}</div>
                      <p className="text-sm text-gray-600 mt-0.5">{p.summary}</p>
                      <p className="text-sm text-red-700 font-medium mt-1">⚡ Action: {p.action_required}</p>
                      {p.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.flags.map(f => (
                            <span key={f} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stable patients */}
            {report.stable_patients.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-amber-600 mb-3">🟡 Stable Patients ({report.stable_patients.length})</h3>
                <div className="space-y-3">
                  {report.stable_patients.map((p, i) => (
                    <div key={i} className="border-l-4 border-amber-300 pl-3">
                      <div className="font-semibold text-gray-900 text-sm">{p.patient_ref}</div>
                      <p className="text-sm text-gray-600 mt-0.5">{p.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discharged */}
            {report.discharged_patients.length > 0 && (
              <div className="bg-white rounded-2xl border border-green-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-green-600 mb-3">🟢 Discharged / Transferred ({report.discharged_patients.length})</h3>
                <div className="space-y-3">
                  {report.discharged_patients.map((p, i) => (
                    <div key={i} className="border-l-4 border-green-300 pl-3">
                      <div className="font-semibold text-gray-900 text-sm">{p.patient_ref}</div>
                      <p className="text-sm text-gray-600 mt-0.5">{p.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall notes */}
            {report.handover_notes && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <h3 className="text-sm font-bold text-blue-700 mb-2">📋 Overall Shift Notes</h3>
                <p className="text-sm text-blue-800">{report.handover_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm hover:border-gray-300 transition-colors"
              >
                {copied ? '✅ Copied!' : '📋 Copy Report'}
              </button>
              <button
                onClick={handleEndShift}
                className="flex-1 bg-[#0066CC] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0052a3] transition-colors"
              >
                ✓ End Shift
              </button>
            </div>

            {/* Plain text preview */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">WhatsApp-ready text</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{report.plain_text_report}</pre>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
