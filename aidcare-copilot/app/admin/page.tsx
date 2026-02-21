'use client';
// AidCare Copilot — Admin Dashboard

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminDashboard } from '../../lib/api';
import { AdminDashboard, DoctorDashboardCard } from '../../types';

const STATUS_CONFIG = {
  green: { label: 'Safe',     color: '#16A34A', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  amber: { label: 'Moderate', color: '#D97706', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  red:   { label: 'High Risk', color: '#DC2626', bg: 'bg-red-100',  text: 'text-red-700',   dot: 'bg-red-500'   },
};

function DoctorCard({ doc, onView }: { doc: DoctorDashboardCard; onView: (id: string) => void }) {
  const cfg = STATUS_CONFIG[doc.status];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900 text-sm">{doc.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{doc.specialty} · {doc.ward}</div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
          CLS {doc.cls}
        </div>
      </div>

      {/* Mini bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, doc.cls)}%`, backgroundColor: cfg.color }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>👤 {doc.patients_seen} patients</span>
          <span>⏱ {doc.hours_active.toFixed(1)}h</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [dashboard,  setDashboard]  = useState<AdminDashboard | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<'all' | 'red' | 'amber' | 'green'>('all');

  useEffect(() => { load(); }, []);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredDoctors = dashboard?.doctors.filter(d =>
    filter === 'all' ? true : d.status === filter
  ) ?? [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <div>
                <span className="text-base font-bold text-gray-900">AidCare <span className="font-light text-[#0066CC]">Copilot</span></span>
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="text-xs text-gray-400 hover:text-[#0066CC] transition-colors"
              >
                {refreshing ? 'Refreshing…' : '↻ Refresh'}
              </button>
              <button
                onClick={() => router.push('/doctor')}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                Doctor login →
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">{error}</div>
        ) : dashboard && (
          <>
            {/* Red zone alerts banner */}
            {dashboard.red_zone_alerts.length > 0 && (
              <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="text-sm font-bold text-red-700">⚠️ Red Zone Alerts — Immediate Attention Required</h2>
                </div>
                <div className="space-y-3">
                  {dashboard.red_zone_alerts.map((alert, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 text-sm">{alert.name}</span>
                        <span className="text-red-600 font-bold text-sm">CLS {alert.cls}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Team Overview</h2>
                <span className="text-xs text-gray-400">
                  Updated {new Date(dashboard.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{dashboard.team_stats.total_active}</div>
                  <div className="text-xs text-gray-500">Active doctors</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{dashboard.team_stats.total_patients_today}</div>
                  <div className="text-xs text-gray-500">Patients today</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{dashboard.team_stats.avg_cls.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Avg CLS</div>
                </div>
              </div>

              {/* Status distribution */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { key: 'green', label: 'Safe',     count: dashboard.team_stats.green_count },
                  { key: 'amber', label: 'Moderate', count: dashboard.team_stats.amber_count },
                  { key: 'red',   label: 'High Risk', count: dashboard.team_stats.red_count  },
                ].map(({ key, label, count }) => {
                  const cfg = STATUS_CONFIG[key as 'green' | 'amber' | 'red'];
                  return (
                    <div key={key} className={`rounded-xl p-3 text-center ${cfg.bg}`}>
                      <div className={`text-xl font-bold ${cfg.text}`}>{count}</div>
                      <div className={`text-xs ${cfg.text} opacity-80`}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Doctor grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">All Doctors</h2>
                {/* Filter tabs */}
                <div className="flex gap-1">
                  {(['all', 'red', 'amber', 'green'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-[#0066CC] text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-400 text-sm">No doctors match this filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDoctors
                    .sort((a, b) => b.cls - a.cls) // highest CLS first
                    .map(doc => (
                      <DoctorCard
                        key={doc.doctor_id}
                        doc={doc}
                        onView={id => router.push(`/admin/doctor/${id}`)}
                      />
                    ))
                  }
                </div>
              )}
            </div>

            {/* How CLS works */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">About Cognitive Load Score (CLS)</h3>
              <div className="text-xs text-blue-600 space-y-1">
                <p>CLS is a 0–100 score calculated from 4 components:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li><strong>Volume</strong> (30 pts) — patients seen this shift</li>
                  <li><strong>Complexity</strong> (30 pts) — average consultation complexity</li>
                  <li><strong>Duration</strong> (20 pts) — hours on shift</li>
                  <li><strong>Consecutive</strong> (20 pts) — back-to-back recent shifts</li>
                </ul>
                <p className="mt-1">🟢 0–39 Safe · 🟡 40–69 Moderate · 🔴 70+ High Risk</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
