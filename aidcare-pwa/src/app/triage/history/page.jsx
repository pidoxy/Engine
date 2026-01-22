"use client";

import ChwShell from '../../components/ChwShell';

export default function TriageHistoryPage() {
  return (
    <ChwShell>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient History</h1>
        <p className="text-gray-600">Patient history and previous assessments will be displayed here.</p>
      </div>
    </ChwShell>
  );
}