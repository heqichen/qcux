import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import type { Link, LinkTransition, ProjectFile } from '@/types/project';
import { btnStyle, dialogOverlayStyle, dialogStyle, inputStyle, toolboxStyle } from '@/views/InteractionView/styles';

const LINK_TRANSITION_OPTIONS: Array<{ value: LinkTransition; label: string }> = [
  { value: 'instant', label: '直接出现（默认）' },
  { value: 'slide-right', label: '右侧滑入' },
  { value: 'slide-left', label: '左侧滑入' },
  { value: 'slide-up', label: '上边滑入' },
  { value: 'slide-down', label: '下边滑入' },
];

export const InteractionToolbox: React.FC = () => {
  const selectedPageId = useUIStore((state) => state.selectedPageId);
  const selectedLinkId = useUIStore((state) => state.selectedLinkId);
  const selectLink = useUIStore((state) => state.selectLink);
  const startLinkCreation = useUIStore((state) => state.startLinkCreation);
  const removeLink = useProjectStore((state) => state.removeLink);
  const updateLink = useProjectStore((state) => state.updateLink);
  const updateProjectName = useProjectStore((state) => state.updateProjectName);
  const project = useProjectStore((state) => state.project);
  const [showElementList, setShowElementList] = useState(false);

  const selectedPage = project.pages.find((page) => page.id === selectedPageId);
  const selectedLink = project.links.find((link) => link.id === selectedLinkId);

  const handleElementSelect = (elementId: string) => {
    if (selectedPageId) {
      startLinkCreation(selectedPageId, elementId);
      setShowElementList(false);
    }
  };

  return (
    <div style={toolboxStyle}>
      <h3 style={titleStyle}>交互工具箱</h3>

      {selectedLink && (
        <LinkProperties
          link={selectedLink}
          project={project}
          onTransitionChange={(transition) => updateLink(selectedLink.id, { transition })}
          onDelete={() => {
            removeLink(selectedLink.id);
            selectLink(null);
          }}
        />
      )}

      {!selectedLink && selectedPage && (
        <>
          <div style={{ marginTop: 0 }}>
            <button style={btnStyle} onClick={() => setShowElementList(true)}>🔗 添加交互</button>
          </div>
          <div style={infoBlockStyle}>
            <div>选中界面: {selectedPage.title}</div>
            <div>尺寸: {selectedPage.width}×{selectedPage.height}</div>
            <div>元素数: {selectedPage.elements.length}</div>
            <div>链接数: {project.links.filter((link) => link.sourcePageId === selectedPage.id).length}</div>
          </div>
        </>
      )}

      {!selectedLink && !selectedPage && (
        <div style={emptyStateStyle}>
          <div style={emptyStateTitleStyle}>项目名称</div>
          <input
            style={inputStyle}
            value={project.metadata.name}
            placeholder="输入项目名称"
            onChange={(event) => updateProjectName(event.target.value)}
          />
          <div style={emptyStateHintStyle}>未选中界面或交互时，可以在这里直接修改项目名称。</div>
        </div>
      )}

      {showElementList && selectedPage && (
        <ElementListDialog
          elements={selectedPage.elements}
          onSelect={handleElementSelect}
          onClose={() => setShowElementList(false)}
        />
      )}
    </div>
  );
};

const ElementListDialog: React.FC<{
  elements: { id: string; type: string; content?: string; name?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
}> = ({ elements, onSelect, onClose }) => (
  <div style={dialogOverlayStyle} onClick={onClose}>
    <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>选择交互元素</h3>
      {elements.length === 0 ? (
        <div style={{ color: '#999' }}>该界面暂无元素</div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {elements.map((element) => (
            <div
              key={element.id}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: 13,
              }}
              onClick={() => onSelect(element.id)}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#e8f0fe';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
              }}
            >
              [{element.type}] {element.content || element.name || element.type}
            </div>
          ))}
        </div>
      )}
      <button style={{ ...btnStyle, marginTop: 12 }} onClick={onClose}>取消</button>
    </div>
  </div>
);

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
};

const infoBlockStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: 12,
  color: '#666',
  lineHeight: 1.8,
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 10,
};

const emptyStateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.6,
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const emptyStateTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
};

const emptyStateHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const linkFieldStyle: React.CSSProperties = {
  marginTop: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const linkFieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#475569',
  fontWeight: 600,
};

const linkSelectStyle: React.CSSProperties = {
  ...inputStyle,
  width: '100%',
  flex: 'none',
  background: '#fff',
};

const LinkProperties: React.FC<{
  link: Link;
  project: ProjectFile;
  onTransitionChange: (transition: LinkTransition) => void;
  onDelete: () => void;
}> = ({ link, project, onTransitionChange, onDelete }) => {
  const sourcePage = project.pages.find((page) => page.id === link.sourcePageId);
  const targetPage = project.pages.find((page) => page.id === link.targetPageId);
  const sourceElement = sourcePage?.elements.find((element) => element.id === link.sourceElementId);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#E53935' }}>🔗 交互链接</h3>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
        <div><b>来自:</b> {sourcePage?.title || '?'} → {sourceElement ? `[${sourceElement.type}] ${'content' in sourceElement ? sourceElement.content : sourceElement.name}` : '?'}</div>
        <div><b>去往:</b> {targetPage?.title || '?'}</div>
      </div>
      <div style={linkFieldStyle}>
        <div style={linkFieldLabelStyle}>出现方式</div>
        <select
          style={linkSelectStyle}
          value={link.transition || 'instant'}
          onChange={(event) => onTransitionChange(event.target.value as LinkTransition)}
        >
          {LINK_TRANSITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <button
        style={{ ...btnStyle, marginTop: 12, color: '#E53935', borderColor: '#E53935', width: '100%' }}
        onClick={onDelete}
      >
        🗑 删除链接
      </button>
    </div>
  );
};