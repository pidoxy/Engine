"use client";

export default function TriageError({ message, onRetry, onSwitchToText }) {
  const errorMessage = message || 'Recording was too short to analyze';

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white rounded-3xl shadow-strong p-10 ring-1 ring-slate-200/50 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Error Illustration */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center relative z-10">
            <span className="material-symbols-outlined text-rose-500 text-4xl">mic_off</span>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-2 -mt-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-20 border border-slate-50">
            <span className="material-symbols-outlined text-rose-500 text-lg">priority_high</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">Analysis Not Possible</h2>
        <p className="text-slate-500 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
          {errorMessage}. Please ensure you speak clearly for at least 5 seconds.
        </p>

        <div className="space-y-4 max-w-xs mx-auto">
          <button
            onClick={onRetry}
            className="w-full btn bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-base font-semibold"
          >
            <span className="material-symbols-outlined">refresh</span>
            Try Again
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={onSwitchToText}
            className="w-full btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-xl shadow-sm text-sm font-semibold"
          >
            <span className="material-symbols-outlined">keyboard</span>
            Enter Manually
          </button>
        </div>

      </div>

      {/* Help Tip */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">info</span>
          Try finding a quieter place to record
        </p>
      </div>
    </div>
  );
}
