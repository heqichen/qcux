import React, { useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { renderPageThumbnail, renderPageTitleScreenSpace } from '@/canvas/renderers/pageRenderer';
import { renderLinkScreenSpace, renderTempLinkLine, hitTestLinkScreenSpace } from '@/canvas/renderers/linkRenderer';
import { hitTestPage } from '@/canvas/hitTest';
import { screenToWorld } from '@/utils/geometry';
import { CANVAS_BG_COLOR, GRID_COLOR, GRID_SIZE } from '@/utils/constants';
import type { Page } from '@/types/project';

export const InteractionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const project = useProjectStore((s) => s.project);
  const updatePagePosition = useProjectStore((s) => s.updatePagePosition);
  const selectedPageId = useUIStore((s) => s.selectedPageId);
  const selectedLinkId = useUIStore((s) => s.selectedLinkId);
  const selectPage = useUIStore((s) => s.selectPage);
  const selectLink = useUIStore((s) => s.selectLink);
  const navigateToPageDesign = useUIStore((s) => s.navigateToPageDesign);
  const isLinkCreationMode = useUIStore((s) => s.isLinkCreationMode);
  const linkSourcePageId = useUIStore((s) => s.linkSourcePageId);
  const linkSourceElementId = useUIStore((s) => s.linkSourceElementId);
  const addLink = useProjectStore((s) => s.addLink);
  const cancelLinkCreation = useUIStore((s) => s.cancelLinkCreation);

  const viewport = useViewportStore((s) => s.interactionViewport);
  const zoom = useViewportStore((s) => s.zoom);
  const pan = useViewportStore((s) => s.pan);

  const dragRef = useRef<{
    pageId: string | null;
    startX: number;
    startY: number;
    pageStartX: number;
    pageStartY: number;
  } | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseWorldRef = useRef({ x: 0, y: 0 });
  const [mouseWorld, setMouseWorld] = React.useState({ x: 0, y: 0 });

  // 渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    // 网格
    drawGrid(ctx, canvas.width / viewport.scale, canvas.height / viewport.scale, viewport.offsetX, viewport.offsetY, viewport.scale);

    // 页面缩略图
    for (const page of project.pages) {
      renderPageThumbnail(ctx, page, page.id === selectedPageId, page.isLandingPage);
    }

    // 创建链接时的临时线
    if (isLinkCreationMode && linkSourcePageId) {
      const sourcePage = project.pages.find((p) => p.id === linkSourcePageId);
      if (sourcePage) {
        const sourceEl = sourcePage.elements.find((e) => e.id === linkSourceElementId);
        const sx = sourcePage.x + (sourceEl ? sourceEl.x + sourceEl.width / 2 : sourcePage.width / 2);
        const sy = sourcePage.y + (sourceEl ? sourceEl.y + sourceEl.height / 2 : sourcePage.height / 2);
        renderTempLinkLine(ctx, sx, sy, mouseWorld.x, mouseWorld.y);
      }
    }

    ctx.restore();

    // --- 屏幕空间渲染（不受缩放影响） ---

    // 链接线 - 在屏幕空间渲染，固定粗细
    for (const link of project.links) {
      renderLinkScreenSpace(ctx, link, project.pages, viewport.scale, viewport.offsetX, viewport.offsetY, link.id === selectedLinkId);
    }

    // 页面标题 - 固定字体大小
    for (const page of project.pages) {
      renderPageTitleScreenSpace(ctx, page, viewport.scale, viewport.offsetX, viewport.offsetY);
    }
    animFrameRef.current = requestAnimationFrame(render);
  }, [project, selectedPageId, selectedLinkId, viewport, isLinkCreationMode, linkSourcePageId, linkSourceElementId, mouseWorld]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // 窗口大小变化时重渲染
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(render);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [render]);

  const getWorldPos = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        viewport.scale,
        viewport.offsetX,
        viewport.offsetY,
      );
    },
    [viewport],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 中键平移
      if (e.button === 1) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (e.button !== 0) return;
      const world = getWorldPos(e);

      // 链接创建模式
      if (isLinkCreationMode) {
        const targetPage = hitTestPage(project.pages, world.x, world.y);
        if (targetPage && linkSourcePageId && linkSourceElementId) {
          addLink(linkSourcePageId, linkSourceElementId, targetPage.id);
        }
        cancelLinkCreation();
        return;
      }

      // 先检测链接线点击
      const hitLink = hitTestLinkScreenSpace(project.links, project.pages, viewport.scale, viewport.offsetX, viewport.offsetY, e.clientX - canvasRef.current!.getBoundingClientRect().left, e.clientY - canvasRef.current!.getBoundingClientRect().top);
      if (hitLink) {
        selectLink(hitLink.id);
        return;
      }

      const hitPage = hitTestPage(project.pages, world.x, world.y);

      if (hitPage) {
        selectPage(hitPage.id);
        selectLink(null);
        dragRef.current = {
          pageId: hitPage.id,
          startX: e.clientX,
          startY: e.clientY,
          pageStartX: hitPage.x,
          pageStartY: hitPage.y,
        };
      } else {
        selectPage(null);
        selectLink(null);
      }
    },
    [getWorldPos, project.pages, project.links, isLinkCreationMode, linkSourcePageId, linkSourceElementId, selectPage, selectLink, addLink, cancelLinkCreation, viewport],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPos(e);
      setMouseWorld(world);

      // 中键平移
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        pan('interaction', dx, dy);
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // 拖拽页面
      if (dragRef.current) {
        const dx = (e.clientX - dragRef.current.startX) / viewport.scale;
        const dy = (e.clientY - dragRef.current.startY) / viewport.scale;
        updatePagePosition(
          dragRef.current.pageId!,
          dragRef.current.pageStartX + dx,
          dragRef.current.pageStartY + dy,
        );
      }
    },
    [getWorldPos, viewport.scale, updatePagePosition, pan],
  );

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    isPanning.current = false;
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPos(e);
      const hitPage = hitTestPage(project.pages, world.x, world.y);
      if (hitPage) {
        navigateToPageDesign(hitPage.id);
      }
    },
    [getWorldPos, project.pages, navigateToPageDesign],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoom('interaction', e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    },
    [zoom],
  );

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isLinkCreationMode ? 'crosshair' : dragRef.current ? 'grabbing' : 'default',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

function drawGrid(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  worldHeight: number,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;

  const startX = -offsetX / scale;
  const startY = -offsetY / scale;
  const endX = startX + worldWidth + GRID_SIZE;
  const endY = startY + worldHeight + GRID_SIZE;

  for (let x = Math.floor(startX / GRID_SIZE) * GRID_SIZE; x < endX; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = Math.floor(startY / GRID_SIZE) * GRID_SIZE; y < endY; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}
