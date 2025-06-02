import React from 'react';
import SectionCard from './SectionCard';

export default function SuggestedInvestigationsDisplay({ investigations }) {
  const isEmpty = !investigations || investigations.length === 0;
  return (
    <SectionCard title="Suggested Investigations" isEmpty={isEmpty} emptyMessage="No specific investigations suggested based on current input.">
      <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
        {investigations.map((investigation, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            <strong>{investigation.test}</strong>
            {investigation.rationale && <p style={{ margin: '3px 0 0 0', fontSize: '0.9em', color: '#555' }}><em>Rationale:</em> {investigation.rationale}</p>}
            {investigation.source_ref && investigation.source_ref.length > 0 && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8em', color: '#777' }}>
                Source(s): {investigation.source_ref.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}