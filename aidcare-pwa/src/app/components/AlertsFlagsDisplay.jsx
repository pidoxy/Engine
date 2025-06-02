import React from 'react';
import SectionCard from './SectionCard';

export default function AlertsFlagsDisplay({ alerts }) {
  const isEmpty = !alerts || alerts.length === 0;
  return (
    <SectionCard title="⚠️ Alerts & Flags" isEmpty={isEmpty} emptyMessage="No specific alerts or flags identified.">
      <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: '#c0392b' }}>
        {alerts.map((alert, index) => (
          <li key={index} style={{ marginBottom: '5px' }}>{alert}</li>
        ))}
      </ul>
    </SectionCard>
  );
}