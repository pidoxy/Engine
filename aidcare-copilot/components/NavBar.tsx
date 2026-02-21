'use client';
// Shared navigation bar for all doctor-facing pages

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getSessionDoctor,
  getSessionShift,
  clearSessionDoctor,
  getShiftDuration,
} from '../lib/session';

const NAV_LINKS = [
  { href: '/doctor/scribe',   label: 'Scribe',   icon: '🎙️' },
  { href: '/doctor/shift',    label: 'My Shift',  icon: '📋' },
  { href: '/doctor/handover', label: 'Handover',  icon: '🔄' },
  { href: '/doctor/stats',    label: 'My Stats',  icon: '📊' },
];

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700 border-green-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  red:   'bg-red-100   text-red-700   border-red-200',
};

interface NavBarProps {
  cls?: number;
  clsStatus?: 'green' | 'amber' | 'red';
}

export default function NavBar({ cls, clsStatus }: NavBarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [doctor, setDoctor]   = useState<ReturnType<typeof getSessionDoctor>>(null);
  const [shift, setShift]     = useState<ReturnType<typeof getSessionShift>>(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const d = getSessionDoctor();
    const s = getSessionShift();
    if (!d || !s) { router.replace('/doctor'); return; }
    setDoctor(d);
    setShift(s);
    setDuration(getShiftDuration(s.started_at));
    const timer = setInterval(() => setDuration(getShiftDuration(s.started_at)), 60_000);
    return () => clearInterval(timer);
  }, [router]);

  function handleLogout() {
    clearSessionDoctor();
    router.replace('/doctor');
  }

  if (!doctor) return null;

  const status = clsStatus ?? 'green';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0066CC] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-base font-bold text-gray-900">
              AidCare <span className="font-light text-[#0066CC]">Copilot</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cls !== undefined && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                CLS {cls}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Doctor info row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="font-medium text-gray-700">{doctor.name}</span>
          <span>{shift?.ward ?? doctor.ward}  ·  {duration} on shift</span>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1">
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname === link.href
                  ? 'bg-[#0066CC] text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{link.icon}</span>{link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
