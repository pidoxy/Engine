import React from 'react';
import SectionCard from './SectionCard';

export default function MedicationConsiderationsDisplay({ considerations }) {
  const isEmpty = !considerations || considerations.length === 0;
  return (
    <SectionCard title="Medication Considerations & Info" isEmpty={isEmpty} emptyMessage="No specific medication considerations highlighted.">
      <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
        {considerations.map((item, index) => (
          <li key={index} style={{ marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
            <strong>{item.drug_class_or_info}</strong>
            {item.details && <p style={{ margin: '5px 0 0 10px', fontSize: '0.9em' }}>{item.details}</p>}
            {item.source_ref && item.source_ref.length > 0 && (
              <p style={{ margin: '5px 0 0 10px', fontSize: '0.8em', color: '#777' }}>
                Source(s): {item.source_ref.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}