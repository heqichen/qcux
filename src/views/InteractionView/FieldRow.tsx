import React from 'react';

export const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 10 }}>
    <span style={{ width: 70, fontSize: 13, color: '#333' }}>{label}</span>
    {children}
  </div>
);