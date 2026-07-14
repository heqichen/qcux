import React from 'react';
import { ProjectStatus } from '@/components/ProjectStatus';
import { ToolbarLayout } from '../../components/ToolbarLayout';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { getBoundingBox } from '@/utils/geometry';
import { FileButtons } from '@/views/InteractionView/FileButtons';
import { btnStyle, divider } from '@/views/InteractionView/styles';

export const InteractionToolbar: React.FC = () => {
  const selectedPageId = useUIStore((state) => state.selectedPageId);
  const removePage = useProjectStore((state) => state.removePage);
  const setLandingPage = useProjectStore((state) => state.setLandingPage);
  const openAddPageDialog = useUIStore((state) => state.openAddPageDialog);
  const selectPage = useUIStore((state) => state.selectPage);
  const project = useProjectStore((state) => state.project);
  const setViewport = useViewportStore((state) => state.setViewport);

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
    const rects = project.pages.map((page) => ({ x: page.x, y: page.y, width: page.width, height: page.height }));
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
    <ToolbarLayout
      actions={(
        <>
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
        </>
      )}
      status={<ProjectStatus />}
    />
  );
};