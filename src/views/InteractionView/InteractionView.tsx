import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { InteractionCanvas } from '@/canvas/InteractionCanvas';
import { getBoundingBox } from '@/utils/geometry';
import { generateId } from '@/utils/id';
import { DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT } from '@/utils/constants';

// ==================== Toolbar ====================

export const InteractionToolbar: React.FC = () => {
  const selectedPageId = useUIStore((s) => s.selectedPageId);
  const removePage = useProjectStore((s) => s.removePage);
  const setLandingPage = useProjectStore((s) => s.setLandingPage);
  const openAddPageDialog = useUIStore((s) => s.openAddPageDialog);
  const selectPage = useUIStore((s) => s.selectPage);
  const project = useProjectStore((s) => s.project);
  const setViewport = useViewportStore((s) => s.setViewport);

  const handleDelete = () => {
    if (selectedPageId) {
      removePage(selectedPageId);
      selectPage(null);
    }
  };

  const handleSetLandingPage = () => {
    if (selectedPageId) {
      setLandingPage(selectedPageId);
    }
  };

  const handleShowAll = () => {
    const rects = project.pages.map((p) => ({ x: p.x, y: p.y, width: p.width, height: p.height }));
    const bbox = getBoundingBox(rects);
    if (!bbox) return;
    const canvasW = window.innerWidth - 220;
    const canvasH = window.innerHeight - 44;
    const scale = Math.min((canvasW - 100) / bbox.width, (canvasH - 100) / bbox.height, 1.0);
    const offsetX = (canvasW - bbox.width * scale) / 2 - bbox.x * scale;
    const offsetY = (canvasH - bbox.height * scale) / 2 - bbox.y * scale;
    setViewport('interaction', { scale, offsetX, offsetY });
  };

  return (
    <div style={toolbarStyle}>
      <FileButtons />
      <div style={divider} />
      <button style={btnStyle} onClick={handleShowAll}>🔍 显示全局</button>
      <button style={btnStyle} onClick={openAddPageDialog}>➕ 新增界面</button>
      <button
        style={{ ...btnStyle, opacity: selectedPageId ? 1 : 0.4 }}
        disabled={!selectedPageId}
        onClick={handleDelete}
      >
        🗑 删除界面
      </button>
      <button
        style={{ ...btnStyle, opacity: selectedPageId ? 1 : 0.4 }}
        disabled={!selectedPageId}
        onClick={handleSetLandingPage}
      >
        🏠 设置 Landing Page
      </button>
    </div>
  );
};

const FileButtons: React.FC = () => {
  const loadProject = useProjectStore((s) => s.loadProject);
  const getSerializedProject = useProjectStore((s) => s.getSerializedProject);
  const projectPath = useProjectStore((s) => s.projectPath);
  const project = useProjectStore((s) => s.project);

  const handleOpen = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.openFile();
        if (result) {
          const data = JSON.parse(result.content);
          loadProject(data, result.path);
        }
      } else {
        // Browser fallback: file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const text = await file.text();
            loadProject(JSON.parse(text), file.name);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('打开文件失败:', err);
    }
  };

  const handleSave = async () => {
    try {
      const data = getSerializedProject();
      const json = JSON.stringify(data, null, 2);

      if (window.electronAPI) {
        if (projectPath) {
          await window.electronAPI.writeFile(projectPath, json);
        } else {
          const path = await window.electronAPI.saveFile();
          if (path) {
            await window.electronAPI.writeFile(path, json);
            loadProject(data, path);
          }
        }
      } else {
        // Browser fallback
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.qcux.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleExport = async () => {
    try {
      const html = generateExportHTML(project);
      if (window.electronAPI) {
        const path = await window.electronAPI.exportHTML('export.html');
        if (path) {
          await window.electronAPI.writeFile(path, html);
        }
      } else {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.html';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  return (
    <>
      <button style={btnStyle} onClick={handleOpen}>📂 打开项目</button>
      <button style={btnStyle} onClick={handleSave}>💾 保存项目</button>
      <button style={btnStyle} onClick={handleExport}>📤 导出</button>
    </>
  );
};

// ==================== Toolbox ====================

export const InteractionToolbox: React.FC = () => {
  const selectedPageId = useUIStore((s) => s.selectedPageId);
  const selectedLinkId = useUIStore((s) => s.selectedLinkId);
  const selectLink = useUIStore((s) => s.selectLink);
  const startLinkCreation = useUIStore((s) => s.startLinkCreation);
  const removeLink = useProjectStore((s) => s.removeLink);
  const project = useProjectStore((s) => s.project);
  const [showElementList, setShowElementList] = useState(false);

  const selectedPage = project.pages.find((p) => p.id === selectedPageId);
  const selectedLink = project.links.find((l) => l.id === selectedLinkId);

  const handleAddInteraction = () => {
    setShowElementList(true);
  };

  const handleElementSelect = (elementId: string) => {
    if (selectedPageId) {
      startLinkCreation(selectedPageId, elementId);
      setShowElementList(false);
    }
  };

  return (
    <div style={toolboxStyle}>
      {selectedLink && (
        <LinkProperties link={selectedLink} project={project} onDelete={() => { removeLink(selectedLink.id); selectLink(null); }} />
      )}

      {!selectedLink && selectedPage && (
        <>
          <div style={{ marginTop: 0 }}>
            <button style={btnStyle} onClick={handleAddInteraction}>🔗 添加交互</button>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            <div>选中界面: {selectedPage.title}</div>
            <div>尺寸: {selectedPage.width}×{selectedPage.height}</div>
            <div>元素数: {selectedPage.elements.length}</div>
            <div>链接数: {project.links.filter(l => l.sourcePageId === selectedPage.id).length}</div>
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
    <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>选择交互元素</h3>
      {elements.length === 0 ? (
        <div style={{ color: '#999' }}>该界面暂无元素</div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {elements.map((el) => (
            <div
              key={el.id}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: 13,
              }}
              onClick={() => onSelect(el.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e8f0fe')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              [{el.type}] {el.content || el.name || el.type}
            </div>
          ))}
        </div>
      )}
      <button style={{ ...btnStyle, marginTop: 12 }} onClick={onClose}>取消</button>
    </div>
  </div>
);

const LinkProperties: React.FC<{
  link: import('@/types/project').Link;
  project: import('@/types/project').ProjectFile;
  onDelete: () => void;
}> = ({ link, project, onDelete }) => {
  const sourcePage = project.pages.find((p) => p.id === link.sourcePageId);
  const targetPage = project.pages.find((p) => p.id === link.targetPageId);
  const sourceElement = sourcePage?.elements.find((e) => e.id === link.sourceElementId);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#E53935' }}>🔗 交互链接</h3>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
        <div><b>来自:</b> {sourcePage?.title || '?'} → {sourceElement ? `[${sourceElement.type}] ${(sourceElement as any).content || (sourceElement as any).name || sourceElement.type}` : '?'}</div>
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

// ==================== AddPageDialog ====================

export const AddPageDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isAddPageDialogOpen);
  const closeDialog = useUIStore((s) => s.closeAddPageDialog);
  const navigateToPageDesign = useUIStore((s) => s.navigateToPageDesign);
  const addPage = useProjectStore((s) => s.addPage);

  const [title, setTitle] = useState('新界面');
  const [width, setWidth] = useState(String(DEFAULT_PAGE_WIDTH));
  const [height, setHeight] = useState(String(DEFAULT_PAGE_HEIGHT));

  const handleConfirm = () => {
    const w = Number(width) || DEFAULT_PAGE_WIDTH;
    const h = Number(height) || DEFAULT_PAGE_HEIGHT;
    const page = addPage(title || '未命名界面', w, h);
    closeDialog();
    navigateToPageDesign(page.id);
  };

  if (!isOpen) return null;

  return (
    <div style={dialogOverlayStyle} onClick={closeDialog}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px 0' }}>新增界面</h3>
        <FieldRow label="界面标题">
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldRow>
        <FieldRow label="宽度">
          <input style={inputStyle} type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
        </FieldRow>
        <FieldRow label="高度">
          <input style={inputStyle} type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
        </FieldRow>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={btnStyle} onClick={closeDialog}>取消</button>
          <button style={{ ...btnStyle, background: '#4A90D9', color: '#fff', borderColor: '#4A90D9' }} onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Helpers ====================

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 10 }}>
    <span style={{ width: 70, fontSize: 13, color: '#333' }}>{label}</span>
    {children}
  </div>
);

function generateExportHTML(project: import('@/types/project').ProjectFile): string {
  const pagesJson = JSON.stringify(project.pages);
  const landingPage = project.pages.find((p) => p.isLandingPage) || project.pages[0];

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project.metadata.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:sans-serif;overflow:hidden}
.page{display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;overflow:auto}
.page.active{display:flex;align-items:flex-start;justify-content:flex-start}
.element{position:absolute}
.object{border:1px solid #666;background:#fff}
.object::after{content:attr(data-name);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;color:#333}
.text{border:1px dashed #999;background:#fafafa}
.button{display:flex;align-items:center;justify-content:center;border:2px solid #888;background:#e0e0e0;cursor:pointer;text-decoration:underline}
</style>
</head>
<body>
<div id="app"></div>
<script>
var pages = ${pagesJson};
var landingId = "${landingPage?.id || ''}";
var links = ${JSON.stringify(project.links)};

function renderPage(pageId) {
  var app = document.getElementById('app');
  app.innerHTML = '';
  var page = pages.find(function(p) { return p.id === pageId; });
  if (!page) return;

  var container = document.createElement('div');
  container.className = 'page active';
  container.style.width = page.width + 'px';
  container.style.height = page.height + 'px';
  container.style.position = 'relative';

  page.elements.sort(function(a, b) { return a.zIndex - b.zIndex; }).forEach(function(el) {
    var div = document.createElement('div');
    div.className = 'element ' + el.type;
    div.style.left = el.x + 'px';
    div.style.top = el.y + 'px';
    div.style.width = el.width + 'px';
    div.style.height = el.height + 'px';

    if (el.type === 'object') {
      div.setAttribute('data-name', el.name);
    } else if (el.type === 'text') {
      div.textContent = el.content;
      div.style.fontSize = el.fontSize + 'px';
    } else if (el.type === 'button') {
      div.textContent = el.content;
      div.style.fontSize = el.fontSize + 'px';
    }

    // Check for links
    var link = links.find(function(l) {
      return l.sourcePageId === pageId && l.sourceElementId === el.id;
    });
    if (link) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', function() {
        renderPage(link.targetPageId);
      });
    }

    container.appendChild(div);
  });

  app.appendChild(container);
}

renderPage(landingId);
</script>
</body>
</html>`;
}

// ==================== Styles ====================

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  background: '#f5f5f5',
  borderBottom: '1px solid #ddd',
  height: 44,
  flexWrap: 'wrap',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const divider: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#ddd',
  margin: '0 4px',
};

const toolboxStyle: React.CSSProperties = {
  width: 220,
  padding: 16,
  background: '#fafafa',
  borderLeft: '1px solid #ddd',
  overflowY: 'auto',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 3,
  fontSize: 13,
};

const dialogOverlayStyle: React.CSSProperties = {
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

const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  minWidth: 360,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  position: 'relative',
};
