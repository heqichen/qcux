import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import type { Link, ProjectFile } from '@/types/project';
import { btnStyle, dialogOverlayStyle, dialogStyle, toolboxStyle } from '@/views/InteractionView/styles';

export const InteractionToolbox: React.FC = () => {
  const selectedPageId = useUIStore((state) => state.selectedPageId);
  const selectedLinkId = useUIStore((state) => state.selectedLinkId);
  const selectLink = useUIStore((state) => state.selectLink);
  const startLinkCreation = useUIStore((state) => state.startLinkCreation);
  const removeLink = useProjectStore((state) => state.removeLink);
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
      {selectedLink && (
        <LinkProperties
          link={selectedLink}
          project={project}
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
          <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            <div>选中界面: {selectedPage.title}</div>
            <div>尺寸: {selectedPage.width}×{selectedPage.height}</div>
            <div>元素数: {selectedPage.elements.length}</div>
            <div>链接数: {project.links.filter((link) => link.sourcePageId === selectedPage.id).length}</div>
          </div>
        </>
      )}

      {!selectedLink && !selectedPage && (
        <div style={{ color: '#999', padding: 8, fontSize: 13 }}>选择一个界面或交互链接</div>
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

const LinkProperties: React.FC<{
  link: Link;
  project: ProjectFile;
  onDelete: () => void;
}> = ({ link, project, onDelete }) => {
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
      <button
        style={{ ...btnStyle, marginTop: 12, color: '#E53935', borderColor: '#E53935', width: '100%' }}
        onClick={onDelete}
      >
        🗑 删除链接
      </button>
    </div>
  );
};