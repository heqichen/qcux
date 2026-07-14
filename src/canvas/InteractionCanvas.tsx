import React, { useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { hitTestLinkScreenSpace } from '@/canvas/renderers/linkRenderer';
import { hitTestPage } from '@/canvas/hitTest';
import {
  getCanvasPointerPosition,
  getOrderedInteractionPages,
  type InteractionDragState,
  renderInteractionScene,
} from '@/canvas/interactionCanvasUtils';
import { screenToWorld } from '@/utils/geometry';

export const InteractionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const project = useProjectStore((s) => s.project);
  const updatePagePosition = useProjectStore((s) => s.updatePagePosition);
  const selectedPageId = useUIStore((s) => s.selectedPageId);
  const selectedLinkId = useUIStore((s) => s.selectedLinkId);
  const interactionPageOrder = useUIStore((s) => s.interactionPageOrder);
  const bringPageToFront = useUIStore((s) => s.bringPageToFront);
  const selectPage = useUIStore((s) => s.selectPage);
  const selectLink = useUIStore((s) => s.selectLink);
  const navigateToPageDesign = useUIStore((s) => s.navigateToPageDesign);
  const isLinkCreationMode = useUIStore((s) => s.isLinkCreationMode);
  const linkSourcePageId = useUIStore((s) => s.linkSourcePageId);
  const linkSourceElementId = useUIStore((s) => s.linkSourceElementId);
  const addLink = useProjectStore((s) => s.addLink);
  const removeLink = useProjectStore((s) => s.removeLink);
  const cancelLinkCreation = useUIStore((s) => s.cancelLinkCreation);

  const viewport = useViewportStore((s) => s.interactionViewport);
  const zoom = useViewportStore((s) => s.zoom);
  const pan = useViewportStore((s) => s.pan);

  const dragRef = useRef<InteractionDragState | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [mouseWorld, setMouseWorld] = React.useState({ x: 0, y: 0 });
  const orderedPages = React.useMemo(
    () => getOrderedInteractionPages(project.pages, interactionPageOrder),
    [interactionPageOrder, project.pages],
  );

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

    renderInteractionScene({
      ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      project: { ...project, pages: orderedPages },
      selectedPageId,
      selectedLinkId,
      viewport,
      isLinkCreationMode,
      linkSourcePageId,
      linkSourceElementId,
      mouseWorld,
    });

    animFrameRef.current = requestAnimationFrame(render);
  }, [orderedPages, project, selectedPageId, selectedLinkId, viewport, isLinkCreationMode, linkSourcePageId, linkSourceElementId, mouseWorld]);

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
      const point = getCanvasPointerPosition(canvas, e.clientX, e.clientY);

      return screenToWorld(
        point.x,
        point.y,
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
        const targetPage = hitTestPage(orderedPages, world.x, world.y);
        if (targetPage && linkSourcePageId && linkSourceElementId) {
          const existingLink = project.links.find(
            (link) =>
              link.sourcePageId === linkSourcePageId
              && link.sourceElementId === linkSourceElementId,
          );

          if (existingLink?.targetPageId === targetPage.id) {
            cancelLinkCreation();
            return;
          }

          if (existingLink) {
            const shouldReplace = window.confirm('该交互源已经存在跳转，是否删除原有交互并改为新的目标界面？');
            if (!shouldReplace) {
              cancelLinkCreation();
              return;
            }

            removeLink(existingLink.id);
          }

          addLink(linkSourcePageId, linkSourceElementId, targetPage.id);
        }
        cancelLinkCreation();
        return;
      }

      // 先检测链接线点击
      const pointer = getCanvasPointerPosition(canvasRef.current!, e.clientX, e.clientY);
      const hitLink = hitTestLinkScreenSpace(project.links, orderedPages, viewport.scale, viewport.offsetX, viewport.offsetY, pointer.x, pointer.y);
      if (hitLink) {
        selectLink(hitLink.id);
        return;
      }

      const hitPage = hitTestPage(orderedPages, world.x, world.y);

      if (hitPage) {
        bringPageToFront(hitPage.id);
        selectPage(hitPage.id);
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
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
      }
    },
    [getWorldPos, orderedPages, project.links, isLinkCreationMode, linkSourcePageId, linkSourceElementId, selectPage, selectLink, addLink, bringPageToFront, removeLink, cancelLinkCreation, viewport],
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
      const hitPage = hitTestPage(orderedPages, world.x, world.y);
      if (hitPage) {
        navigateToPageDesign(hitPage.id);
      }
    },
    [getWorldPos, navigateToPageDesign, orderedPages],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pointer = getCanvasPointerPosition(canvas, e.clientX, e.clientY);
      zoom('interaction', e.deltaY, pointer.x, pointer.y);
    },
    [zoom],
  );

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
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
