
import React from 'react';
import SectionCard from './SectionCard';

export default function SummaryDisplay({ summary }) {
  const isEmpty = !summary;
  return (
    <SectionCard title="Differential Summary for Doctor" isEmpty={isEmpty} emptyMessage="Summary not available.">
      <p>{summary}</p>
    </SectionCard>
  );
}