import React from 'react';
import { ProjectStatus } from '@/components/ProjectStatus';
import { ToolbarLayout } from '../../components/ToolbarLayout';
import { useProjectSave } from '../../hooks/useProjectSave';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';

export const PageDesignToolbar: React.FC = () => {
  const currentPageId = useUIStore((s) => s.currentPageId);
  const addElement = useProjectStore((s) => s.addElement);
  const selectElement = useUIStore((s) => s.selectElement);
  const navigateToInteraction = useUIStore((s) => s.navigateToInteraction);
  const saveProject = useProjectSave();

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
    <ToolbarLayout
      actions={(
        <>
          <button style={btnStyle} onClick={handleAddObject}>➕ 添加物件</button>
          <button style={btnStyle} onClick={handleAddText}>🔤 添加文字</button>
          <button style={btnStyle} onClick={handleAddButton}>🔘 添加按钮</button>
          <button style={btnStyle} onClick={() => void saveProject()}>💾 保存项目</button>
          <button style={{ ...btnStyle, background: '#666', color: '#fff' }} onClick={navigateToInteraction}>
            ↩ 退出到交互设计界面
          </button>
        </>
      )}
      status={<ProjectStatus />}
    />
  );
};

export const PageDesignToolbox: React.FC = () => {
  const fontSizeStep = 4;
  const currentPageId = useUIStore((s) => s.currentPageId);
  const selectedElementId = useUIStore((s) => s.selectedElementId);
  const selectElement = useUIStore((s) => s.selectElement);
  const project = useProjectStore((s) => s.project);
  const updatePageTitle = useProjectStore((s) => s.updatePageTitle);
  const updatePageOverflowMode = useProjectStore((s) => s.updatePageOverflowMode);
  const updateElement = useProjectStore((s) => s.updateElement);
  const removeElement = useProjectStore((s) => s.removeElement);

  const currentPage = project.pages.find((p) => p.id === currentPageId);
  const selectedElement = currentPage?.elements.find((e) => e.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div style={toolboxStyle}>
        <div style={emptyStateStyle}>
          <div style={emptyStateTitleStyle}>界面名称</div>
          <input
            type="text"
            style={emptyStateInputStyle}
            value={currentPage?.title || ''}
            placeholder="输入界面名称"
            onChange={(event) => {
              if (!currentPageId) return;
              updatePageTitle(currentPageId, event.target.value);
            }}
          />
          <div style={emptyStateTitleStyle}>溢出显示</div>
          <select
            style={emptyStateInputStyle}
            value={currentPage?.overflowMode || 'hidden'}
            onChange={(event) => {
              if (!currentPageId) return;
              updatePageOverflowMode(currentPageId, event.target.value as 'hidden' | 'scroll');
            }}
          >
            <option value="hidden">隐藏</option>
            <option value="scroll">滚动条</option>
          </select>
          <div style={emptyStateHintStyle}>这个设置只影响导出的 HTML。选择滚动条后，导出页面超出界面尺寸的内容可以滚动查看。</div>
          <div style={emptyStateHintStyle}>未选中元素时，可以在这里直接修改当前界面的名称。</div>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string | number) => {
    if (!currentPageId) return;
    updateElement(currentPageId, selectedElement.id, { [field]: value });
  };

  const handleDelete = () => {
    if (!currentPageId) return;
    removeElement(currentPageId, selectedElement.id);
    selectElement(null);
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
          <FullWidthField label="文字">
            <input
              type="text"
              style={fullWidthInputStyle}
              value={selectedElement.content}
              onChange={(e) => handleChange('content', e.target.value)}
            />
          </FullWidthField>
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

      <button style={dangerBtnStyle} onClick={handleDelete}>删除元素</button>
    </div>
  );
};

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
    <span style={{ width: 32, fontSize: 12, color: '#666' }}>{label}</span>
    {children}
  </div>
);

const FullWidthField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12, gap: 6 }}>
    <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
    {children}
  </div>
);

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

const dangerBtnStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 12,
  padding: '8px 12px',
  border: '1px solid #dc2626',
  borderRadius: 4,
  background: '#fff5f5',
  color: '#b91c1c',
  cursor: 'pointer',
  fontSize: 13,
};

const toolboxStyle: React.CSSProperties = {
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

const inputStyle: React.CSSProperties = {
  width: 80,
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
};

const fullWidthInputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
  boxSizing: 'border-box',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 12,
};

const emptyStateTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
};

const emptyStateInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
};

const emptyStateHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  lineHeight: 1.6,
};
