"use client";

import { useState } from 'react';

export default function TriageForm({ onSubmit }) {
  const [patientId, setPatientId] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ patientId, symptoms });
  };

  const addSymptom = (tag) => {
    setSymptoms(prev => prev ? `${prev}, ${tag.toLowerCase()}` : tag.toLowerCase());
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Manual Assessment</h1>
        <p className="text-slate-500 font-medium tracking-wide">Enter clinical details</p>
      </div>

      <div className="bg-white rounded-3xl shadow-strong p-8 md:p-10 ring-1 ring-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient ID */}
          <div className="group">
            <label htmlFor="patientId" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Patient Identifier
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                person
              </span>
              <input
                type="text"
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="ID-12345 or Name"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg rounded-xl pl-12 pr-4 py-4 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                required
              />
            </div>
          </div>

          {/* Symptoms */}
          <div className="group">
            <label htmlFor="symptoms" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Symptoms & Observations
            </label>
            <div className="relative">
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe clinical observations..."
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-xl p-5 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Quick Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Quick Add
            </label>
            <div className="flex flex-wrap gap-2">
              {['Fever', 'Cough', 'Dyspnea', 'Fatigue', 'Nausea', 'Headache', 'Rash'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSymptom(tag)}
                  className="px-4 py-2 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold transition-all active:scale-95"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-slate-900 text-white text-lg font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">medical_services</span>
            Analyze Symptoms
          </button>
        </form>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="bg-cyan-50/50 backdrop-blur-sm border border-cyan-100 rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-cyan-600">mic</span>
          <p className="text-sm text-cyan-900">
            <span className="font-bold">Tip:</span> Voice assessments catch 40% more detail.
          </p>
        </div>
      </div>
    </div>
  );
}
