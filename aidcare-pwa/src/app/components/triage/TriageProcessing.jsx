"use client";

import { useState, useEffect } from 'react';

export default function TriageProcessing({ onCancel }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Transcribing', desc: 'Converting speech to text...' },
    { label: 'Analyzing', desc: 'Identifying symptoms & signs...' },
    { label: 'Matching', desc: 'Checking clinical protocols...' },
    { label: 'Generating', desc: 'Preparing assessment...' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 1;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const step = Math.floor(progress / 25);
    setCurrentStep(Math.min(step, 3));
  }, [progress]);

  const getStepState = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analyzing</h1>
        <p className="text-slate-500 font-medium">Processing clinical assessment</p>
      </div>

      <div className="bg-white rounded-3xl shadow-strong p-8 ring-1 ring-slate-200/50 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        {/* Progress Ring */}
        <div className="flex justify-center mb-12 relative">
          <div className="relative w-40 h-40">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse-slow" />

            <svg className="w-full h-full transform -rotate-90 relative z-10">
              {/* Track */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#f1f5f9"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progress * 4.4} 440`}
                className="transition-all duration-300 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-6 pl-4 relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-2 bottom-4 w-0.5 bg-slate-100" />

          {steps.map((step, index) => {
            const state = getStepState(index);
            return (
              <div key={index} className="relative flex items-center gap-5 group">
                {/* Dot */}
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 z-10 transition-all duration-300
                    ${state === 'completed' ? 'bg-cyan-500 border-cyan-500 scale-110' :
                      state === 'active' ? 'bg-white border-cyan-500 ring-2 ring-cyan-100 scale-125' :
                        'bg-slate-100 border-slate-300'}
                  `}
                >
                  {state === 'active' && <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75" />}
                </div>

                <div className="flex-1 transition-all duration-300 transform">
                  <div className="flex items-baseline justify-between">
                    <h3 className={`font-semibold text-lg ${state === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                      {step.label}
                    </h3>
                    {state === 'active' && (
                      <span className="text-xs font-bold text-cyan-600 animate-pulse tracking-wider uppercase">Processing</span>
                    )}
                    {state === 'completed' && (
                      <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    )}
                  </div>
                  <p className={`text-sm ${state === 'pending' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel */}
        <div className="mt-10 text-center border-t border-slate-100 pt-6">
          <button
            onClick={onCancel}
            className="text-sm text-slate-400 hover:text-rose-500 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
