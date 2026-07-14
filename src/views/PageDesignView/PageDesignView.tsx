import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';

export const PageDesignToolbar: React.FC = () => {
  const currentPageId = useUIStore((s) => s.currentPageId);
  const addElement = useProjectStore((s) => s.addElement);
  const selectElement = useUIStore((s) => s.selectElement);
  const navigateToInteraction = useUIStore((s) => s.navigateToInteraction);

  const handleAddObject = () => {
    if (currentPageId) {
      const el = addElement(currentPageId, 'object');
      selectElement(el.id);
    }
  };

  const handleAddText = () => {
    if (currentPageId) {
      const el = addElement(currentPageId, 'text');
      selectElement(el.id);
    }
  };

  const handleAddButton = () => {
    if (currentPageId) {
      const el = addElement(currentPageId, 'button');
      selectElement(el.id);
    }
  };

  return (
    <div style={toolbarStyle}>
      <button style={btnStyle} onClick={handleAddObject}>➕ 添加物件</button>
      <button style={btnStyle} onClick={handleAddText}>🔤 添加文字</button>
      <button style={btnStyle} onClick={handleAddButton}>🔘 添加按钮</button>
      <div style={{ flex: 1 }} />
      <button style={{ ...btnStyle, background: '#666', color: '#fff' }} onClick={navigateToInteraction}>
        ↩ 退出到交互设计界面
      </button>
    </div>
  );
};

export const PageDesignToolbox: React.FC = () => {
  const fontSizeStep = 4;
  const currentPageId = useUIStore((s) => s.currentPageId);
  const selectedElementId = useUIStore((s) => s.selectedElementId);
  const project = useProjectStore((s) => s.project);
  const updateElement = useProjectStore((s) => s.updateElement);

  const currentPage = project.pages.find((p) => p.id === currentPageId);
  const selectedElement = currentPage?.elements.find((e) => e.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div style={toolboxStyle}>
        <div style={{ color: '#999', padding: 16 }}>选择一个元素以编辑属性</div>
      </div>
    );
  }

  const handleChange = (field: string, value: string | number) => {
    if (!currentPageId) return;
    updateElement(currentPageId, selectedElement.id, { [field]: value });
  };

  return (
    <div style={toolboxStyle}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>属性</h3>

      <FieldRow label="X">
        <input
          type="number"
          style={inputStyle}
          value={Math.round(selectedElement.x)}
          onChange={(e) => handleChange('x', Number(e.target.value))}
        />
      </FieldRow>
      <FieldRow label="Y">
        <input
          type="number"
          style={inputStyle}
          value={Math.round(selectedElement.y)}
          onChange={(e) => handleChange('y', Number(e.target.value))}
        />
      </FieldRow>
      <FieldRow label="宽">
        <input
          type="number"
          style={inputStyle}
          value={Math.round(selectedElement.width)}
          onChange={(e) => handleChange('width', Number(e.target.value))}
        />
      </FieldRow>
      <FieldRow label="高">
        <input
          type="number"
          style={inputStyle}
          value={Math.round(selectedElement.height)}
          onChange={(e) => handleChange('height', Number(e.target.value))}
        />
      </FieldRow>

      {selectedElement.type === 'object' && (
        <FieldRow label="名称">
          <input
            type="text"
            style={inputStyle}
            value={selectedElement.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FieldRow>
      )}

      {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
        <>
          <FieldRow label="文字">
            <input
              type="text"
              style={inputStyle}
              value={selectedElement.content}
              onChange={(e) => handleChange('content', e.target.value)}
            />
          </FieldRow>
          <FieldRow label="字号">
            <input
              type="number"
              style={{ ...inputStyle, width: 60 }}
              value={selectedElement.fontSize}
              onChange={(e) => handleChange('fontSize', Number(e.target.value))}
            />
            <button style={smallBtnStyle} onClick={() => handleChange('fontSize', Math.max(8, selectedElement.fontSize - fontSizeStep))}>
              A-
            </button>
            <button style={smallBtnStyle} onClick={() => handleChange('fontSize', Math.min(128, selectedElement.fontSize + fontSizeStep))}>
              A+
            </button>
          </FieldRow>
        </>
      )}
    </div>
  );
};

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
    <span style={{ width: 32, fontSize: 12, color: '#666' }}>{label}</span>
    {children}
  </div>
);

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  background: '#f5f5f5',
  borderBottom: '1px solid #ddd',
  height: 44,
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: 3,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};

const toolboxStyle: React.CSSProperties = {
  width: 240,
  padding: 16,
  background: '#fafafa',
  borderLeft: '1px solid #ddd',
  overflowY: 'auto',
};

const inputStyle: React.CSSProperties = {
  width: 80,
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
};
