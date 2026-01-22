"use client";

import { useState } from 'react';

export default function TriageResults({ result, onStartNew }) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Extract data from API response
  const recommendation = result?.triage_recommendation || {};
  const summary = recommendation?.summary_of_findings || "No summary available.";

  // Map urgency level from API to component format
  const apiUrgency = recommendation?.urgency_level || '';
  let urgencyLevel = 'medium';
  if (apiUrgency.toLowerCase().includes('urgent') || apiUrgency.toLowerCase().includes('emergency') || apiUrgency.toLowerCase().includes('immediate')) {
    urgencyLevel = 'high';
  } else if (apiUrgency.toLowerCase().includes('routine') || apiUrgency.toLowerCase().includes('monitor at home')) {
    urgencyLevel = 'low';
  }

  // Placeholder vitals (can be added to backend later)
  const vitals = result?.vitals || [];

  // Get actions from API
  const actions = recommendation?.recommended_actions_for_chw || [];

  // Get guidelines from API
  const guidelines = recommendation?.key_guideline_references || [];

  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'high':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-100',
          text: 'text-rose-900',
          accent: 'bg-rose-500',
          icon: 'warning',
          title: 'Urgent Referral Required',
          desc: 'Immediate medical attention recommended. Arrange transport to facility.',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          text: 'text-amber-900',
          accent: 'bg-amber-500',
          icon: 'priority_high',
          title: 'Monitor Closely',
          desc: 'Conditions require observation. Follow-up usage advised.',
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-100',
          text: 'text-emerald-900',
          accent: 'bg-emerald-500',
          icon: 'check_circle',
          title: 'Routine Care',
          desc: 'Standard home treatment appropriate. No danger signs.',
        };
    }
  };

  const urgency = getUrgencyConfig();

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Assessment Report</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">event</span>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            •
            <span className="material-symbols-outlined text-sm">schedule</span>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <span className="material-symbols-outlined">print</span>
            Print
          </button>
          <button onClick={onStartNew} className="btn bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:-translate-y-0.5 transition-all">
            <span className="material-symbols-outlined">add</span>
            New Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Main Results */}
        <div className="lg:col-span-2 space-y-8">

          {/* Urgency Banner */}
          <div className={`rounded-3xl p-1 overflow-hidden shadow-lg ${urgency.bg}`}>
            <div className={`rounded-2xl border ${urgency.border} p-6 md:p-8 flex items-start gap-6 relative overflow-hidden`}>
              {/* Decorational Circle */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 ${urgency.accent}`} />

              <div className={`w-16 h-16 rounded-2xl ${urgency.accent} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <span className="material-symbols-outlined text-4xl">{urgency.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className={`text-2xl font-bold ${urgency.text}`}>{urgency.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/60 ${urgency.text} uppercase tracking-wider`}>
                    {urgencyLevel} Priority
                  </span>
                </div>
                <p className={`${urgency.text} opacity-80 text-lg leading-relaxed`}>{urgency.desc}</p>
              </div>
            </div>
          </div>

          {/* Extracted Symptoms */}
          {result?.extracted_symptoms && result.extracted_symptoms.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">medical_information</span>
                Extracted Symptoms
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
                <div className="flex flex-wrap gap-2">
                  {result.extracted_symptoms.map((symptom, i) => (
                    <span key={i} className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium border border-cyan-100">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Vitals Grid (if provided) */}
          {vitals && vitals.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">monitor_heart</span>
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vitals.map((vital, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:shadow-medium transition-shadow">
                    <p className="text-slate-500 text-sm font-medium mb-1">{vital.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${vital.status === 'warning' ? 'text-amber-500' : 'text-slate-900'}`}>
                        {vital.value}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{vital.unit}</span>
                    </div>
                    {vital.status === 'warning' && (
                      <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-md">
                        Check
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clinical Summary */}
          <section className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">description</span>
                Clinical Summary
              </h3>
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                AI Analysis
              </span>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed text-lg">
                {summary}
              </p>
            </div>
          </section>

          {/* Guidelines Accordion */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
            >
              <span className="font-semibold text-slate-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">menu_book</span>
                Referenced Guidelines
              </span>
              <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${showGuidelines ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            <div className={`transition-all duration-300 overflow-hidden ${showGuidelines ? 'max-h-96' : 'max-h-0'}`}>
              <div className="p-4 pt-0 border-t border-slate-100">
                <ul className="space-y-3 mt-4">
                  {guidelines.length > 0 ? (
                    guidelines.map((g, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {g}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500 italic">No specific guidelines referenced</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Actions & Map */}
        <div className="space-y-8">

          {/* Action List */}
          <div className="bg-white rounded-3xl p-6 shadow-strong border border-slate-100 ring-4 ring-slate-50">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600">checklist</span>
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {actions.length > 0 ? (
                actions.map((action, i) => (
                  <label key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-cyan-100 cursor-pointer transition-all group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" className="peer w-5 h-5 appearance-none rounded-md border-2 border-slate-300 checked:bg-cyan-500 checked:border-cyan-500 transition-colors" />
                      <span className="material-symbols-outlined text-white text-sm absolute opacity-0 peer-checked:opacity-100 pointer-events-none transform scale-0 peer-checked:scale-100 transition-all">check</span>
                    </div>
                    <span className="text-slate-700 font-medium leading-tight group-hover:text-slate-900 transition-colors">{action}</span>
                  </label>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic text-center py-4">No specific actions recommended</p>
              )}
            </div>

            {/* Important Notes */}
            {recommendation?.important_notes_for_chw && recommendation.important_notes_for_chw.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Important Notes
                </h4>
                <ul className="space-y-2">
                  {recommendation.important_notes_for_chw.map((note, i) => (
                    <li key={i} className="text-sm text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Nearest Facility */}
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Nearest Facility</h3>
              <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">Open 24/7</span>
            </div>

            <div className="aspect-video bg-slate-100 rounded-xl mb-4 relative overflow-hidden group">
              {/* Map Placeholder */}
              <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-400">map</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                District Hospital
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex-1 btn btn-secondary text-sm py-2">
                <span className="material-symbols-outlined text-sm">directions</span>
                Directions
              </button>
              <button className="flex-1 btn btn-secondary text-sm py-2">
                <span className="material-symbols-outlined text-sm">call</span>
                Call
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center px-4 leading-relaxed">
            This AI-assisted assessment is for support only. Always use professional clinical judgment.
          </p>

        </div>
      </div>
    </div>
  );
}
