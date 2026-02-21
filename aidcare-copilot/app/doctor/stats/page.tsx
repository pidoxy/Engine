'use client';
// AidCare Copilot — Doctor Stats / Burnout Dashboard

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import { getSessionDoctor, getSessionShift } from '../../../lib/session';
import { getBurnoutScore } from '../../../lib/api';
import { BurnoutDetail } from '../../../types';

const STATUS_CONFIG = {
  green: { label: 'Safe',     color: '#16A34A', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  amber: { label: 'Moderate', color: '#D97706', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  red:   { label: 'High',     color: '#DC2626', bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700'   },
};

function CLSGauge({ cls, status }: { cls: number; status: 'green' | 'amber' | 'red' }) {
  const cfg = STATUS_CONFIG[status];
  const pct = Math.min(100, cls);
  // Semicircle gauge via SVG
  const r = 60;
  const cx = 80, cy = 80;
  const circ = Math.PI * r; // half circle circumference
  const dashOffset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke={cfg.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${dashOffset}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* CLS number */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="700" fill={cfg.color}>
          {cls}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="#6B7280">
          / 100
        </text>
      </svg>
      <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label} Load</span>
    </div>
  );
}

function ScoreBar({ label, value, max = 30, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const doctor = getSessionDoctor();
  const shift  = getSessionShift();

  const [burnout,  setBurnout]  = useState<BurnoutDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!doctor || !shift) { router.replace('/doctor'); return; }
    load();
  }, [doctor, shift, router]);

  async function load(isRefresh = false) {
    if (!doctor) return;
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getBurnoutScore(doctor.doctor_id);
      setBurnout(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (!doctor || !shift) return null;

  const cls    = burnout?.cognitive_load_score ?? 0;
  const status = burnout?.status ?? 'green';
  const cfg    = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <NavBar cls={cls} clsStatus={status} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0066CC] border-t-transparent rounded-full spinner" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        ) : burnout && (
          <>
            {/* Main CLS card */}
            <div className={`bg-white rounded-2xl border shadow-sm p-6 ${cfg.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-base font-semibold text-gray-900">Cognitive Load Score</h1>
                <button
                  onClick={() => load(true)}
                  disabled={refreshing}
                  className="text-xs text-gray-400 hover:text-[#0066CC] transition-colors"
                >
                  {refreshing ? 'Refreshing…' : '↻ Refresh'}
                </button>
              </div>

              <CLSGauge cls={cls} status={status} />

              <div className={`rounded-xl p-3 mt-4 ${cfg.bg}`}>
                <p className={`text-sm ${cfg.text}`}>{burnout.recommendation}</p>
              </div>
            </div>

            {/* Current shift */}
            {burnout.current_shift && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Shift</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{burnout.current_shift.patients_seen}</div>
                    <div className="text-xs text-gray-500">Patients seen</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{burnout.current_shift.hours_active.toFixed(1)}h</div>
                    <div className="text-xs text-gray-500">Hours active</div>
                  </div>
                </div>
              </div>
            )}

            {/* Score breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Breakdown</h2>
              <div className="space-y-3">
                <ScoreBar label="Patient Volume"      value={burnout.score_breakdown.volume}      max={30} color="#0066CC" />
                <ScoreBar label="Case Complexity"     value={burnout.score_breakdown.complexity}  max={30} color="#7C3AED" />
                <ScoreBar label="Shift Duration"      value={burnout.score_breakdown.duration}    max={20} color="#D97706" />
                <ScoreBar label="Consecutive Shifts"  value={burnout.score_breakdown.consecutive} max={20} color="#DC2626" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span className="font-bold text-gray-700">{cls} / 100</span>
              </div>
            </div>

            {/* 7-day history */}
            {burnout.history_7_days.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">7-Day CLS History</h2>
                <div className="space-y-2">
                  {[...burnout.history_7_days].slice(-10).reverse().map((h, i) => {
                    const s = h.status as 'green' | 'amber' | 'red';
                    const c = STATUS_CONFIG[s];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-32 shrink-0">{h.date}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, h.cls)}%`, backgroundColor: c.color }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-8 text-right ${c.text}`}>{h.cls}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thresholds guide */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">CLS Thresholds</h2>
              <div className="space-y-2">
                {(
                  [
                    { range: '0–39',   status: 'green' as const, desc: 'Safe — normal load' },
                    { range: '40–69',  status: 'amber' as const, desc: 'Moderate — consider a break' },
                    { range: '70–100', status: 'red'   as const, desc: 'High — relief recommended' },
                  ]
                ).map(({ range, status, desc }) => {
                  const c = STATUS_CONFIG[status];
                  return (
                    <div key={range} className={`flex items-center gap-3 rounded-lg p-2.5 ${c.bg}`}>
                      <div className="w-10 text-xs font-bold text-center" style={{ color: c.color }}>{range}</div>
                      <div className={`text-xs ${c.text}`}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
