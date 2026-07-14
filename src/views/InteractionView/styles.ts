import type React from 'react';

export const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: '#f5f5f5',
  borderBottom: '1px solid #ddd',
  height: 44,
  minHeight: 44,
  overflow: 'hidden',
};

export const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

export const divider: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#ddd',
  margin: '0 4px',
};

export const toolboxStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: 16,
  background: '#f6f7f9',
  borderLeft: '1px solid #cfd4dc',
  overflowY: 'auto',
  overflowX: 'hidden',
  position: 'relative',
  zIndex: 1,
  boxShadow: '-6px 0 16px rgba(15, 23, 42, 0.08)',
};

export const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
};

export const dialogOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

export const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  minWidth: 360,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  position: 'relative',
};