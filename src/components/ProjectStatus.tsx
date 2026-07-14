import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getProjectDisplayPath } from '@/utils/projectTitle';

export const ProjectStatus: React.FC = () => {
  const projectPath = useProjectStore((state) => state.projectPath);
  const isDirty = useProjectStore((state) => state.isDirty);
  const displayPath = getProjectDisplayPath(projectPath);

  return (
    <div style={statusContainerStyle} title={displayPath}>
      <span style={labelStyle}>{displayPath}</span>
      {isDirty && <span aria-label="未保存更改" title="未保存更改" style={dirtyDotStyle} />}
    </div>
  );
};

const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 96,
  maxWidth: '40vw',
  padding: '0 10px',
  border: '1px solid #d7d7d7',
  borderRadius: 999,
  background: '#fff',
  height: 30,
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
  color: '#333',
};

const dirtyDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#111',
  flexShrink: 0,
};