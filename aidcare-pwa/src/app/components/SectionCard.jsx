import React from 'react';

export default function SectionCard({ title, children, isEmpty, emptyMessage = "No information available." }) {
    return (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: '0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{title}</h3>
            {isEmpty ? (
                <p style={{ fontStyle: 'italic', color: '#777' }}>{emptyMessage}</p>
            ) : (
                children
            )}
        </div>
    );
}