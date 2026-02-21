'use client';
// AidCare Copilot — My Shift Page

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import { getSessionDoctor, getSessionShift, getShiftDuration } from '../../../lib/session';
import { getShiftConsultations, getBurnoutScore } from '../../../lib/api';
import { Consultation, BurnoutDetail } from '../../../types';

const COMPLEXITY_COLORS = ['', 'bg-green-100 text-green-700', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700'];
const COMPLEXITY_LABELS = ['', 'Routine', 'Mild', 'Moderate', 'Complex', 'Critical'];

export default function ShiftPage() {
  const router = useRouter();
  const doctor = getSessionDoctor();
  const shift  = getSessionShift();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error,   setError]               = useState('');
  const [burnout, setBurnout]             = useState<BurnoutDetail | null>(null);
  const [expanded, setExpanded]           = useState<string | null>(null);

  useEffect(() => {
    if (!doctor || !shift) { router.replace('/doctor'); return; }
    Promise.all([
      getShiftConsultations(doctor.doctor_id, shift.shift_id),
      getBurnoutScore(doctor.doctor_id),
    ])
      .then(([consResult, burnResult]) => {
        setConsultations(consResult.consultations);
        setBurnout(burnResult);
      })
      .catch(err => setError(err.message || 'Failed to load shift data'))
      .finally(() => setLoading(false));
  }, [doctor, shift, router]);

  if (!doctor || !shift) return null;

  const cls    = burnout?.cognitive_load_score;
  const status = burnout?.status ?? 'green';
  const totalDuration = getShiftDuration(shift.started_at);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <NavBar cls={cls} clsStatus={status} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Shift summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900">My Current Shift</h1>
              <p className="text-xs text-gray-400 mt-0.5">{shift.ward} · {totalDuration}</p>
            </div>
            <span className="text-2xl font-bold text-[#0066CC]">{consultations.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-lg font-bold text-gray-900">{consultations.length}</div>
              <div className="text-xs text-gray-500">Patients</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-lg font-bold text-gray-900">
                {consultations.length > 0
                  ? (consultations.reduce((sum, c) => sum + c.complexity_score, 0) / consultations.length).toFixed(1)
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">Avg Complexity</div>
            </div>
            <div className={`rounded-xl p-3 ${status === 'red' ? 'bg-red-50' : status === 'amber' ? 'bg-amber-50' : 'bg-green-50'}`}>
              <div className={`text-lg font-bold ${status === 'red' ? 'text-red-600' : status === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>
                {cls ?? '—'}
              </div>
              <div className="text-xs text-gray-500">CLS</div>
            </div>
          </div>

          {/* Burnout recommendation */}
          {burnout?.recommendation && (
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{burnout.recommendation}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/doctor/scribe')}
            className="flex-1 bg-[#0066CC] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#0052a3] transition-colors"
          >
            🎙️ Record Patient
          </button>
          <button
            onClick={() => router.push('/doctor/handover')}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm hover:border-gray-300 transition-colors"
          >
            🔄 End Shift
          </button>
        </div>

        {/* Consultation list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Consultations this shift ({consultations.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-[#0066CC] border-t-transparent rounded-full spinner" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          ) : consultations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-gray-500 text-sm">No consultations yet.</p>
              <p className="text-gray-400 text-xs mt-1">Record your first patient using the Scribe tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...consultations].reverse().map((c, idx) => (
                <div
                  key={c.consultation_id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Header row */}
                  <button
                    className="w-full flex items-center justify-between p-4 text-left"
                    onClick={() => setExpanded(expanded === c.consultation_id ? null : c.consultation_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0066CC]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#0066CC]">
                        {consultations.length - idx}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{c.patient_ref || 'Unknown patient'}</div>
                        <div className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.flags.slice(0, 1).map(flag => (
                        <span key={flag} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 hidden sm:inline">
                          🚨 {flag}
                        </span>
                      ))}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COMPLEXITY_COLORS[c.complexity_score]}`}>
                        {COMPLEXITY_LABELS[c.complexity_score]}
                      </span>
                      <span className="text-gray-400 text-xs">{expanded === c.consultation_id ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expanded === c.consultation_id && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                      {c.patient_summary && (
                        <p className="text-sm text-gray-600">{c.patient_summary}</p>
                      )}
                      {c.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.flags.map(f => (
                            <span key={f} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">🚨 {f}</span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        {[
                          { key: 'subjective', label: 'S' },
                          { key: 'objective',  label: 'O' },
                          { key: 'assessment', label: 'A' },
                          { key: 'plan',       label: 'P' },
                        ].map(({ key, label }) => {
                          const text = c.soap_note[key as keyof typeof c.soap_note];
                          if (!text) return null;
                          return (
                            <div key={key} className="text-xs">
                              <span className="font-semibold text-[#0066CC]">{label} </span>
                              <span className="text-gray-600">{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
