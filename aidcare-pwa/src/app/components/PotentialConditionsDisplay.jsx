import React from 'react';
import SectionCard from './SectionCard';

export default function PotentialConditionsDisplay({ conditions }) {
  const isEmpty = !conditions || conditions.length === 0;
  return (
    <SectionCard title="Potential Conditions" isEmpty={isEmpty} emptyMessage="No specific potential conditions identified based on input.">
      <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
        {conditions.map((condition, index) => (
          <li key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #eee' }}>
            <strong>{condition.name}</strong>
            {condition.reasoning && <p style={{ margin: '5px 0 0 10px', fontSize: '0.9em', color: '#555' }}><em>Reasoning:</em> {condition.reasoning}</p>}
            {condition.source_ref && condition.source_ref.length > 0 && (
              <p style={{ margin: '5px 0 0 10px', fontSize: '0.8em', color: '#777' }}>
                Source(s): {condition.source_ref.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}