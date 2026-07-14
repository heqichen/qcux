import React, { useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { renderSelection, hitTestHandle } from '@/canvas/renderers/selectionRenderer';
import { hitTestElement } from '@/canvas/hitTest';
import {
  fitPageToViewport,
  getCanvasPointerPosition,
  getResizeCursor,
  renderPageDesignScene,
} from './pageDesignCanvasUtils';
import { screenToWorld } from '@/utils/geometry';

export const PageDesignCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const currentPageId = useUIStore((s) => s.currentPageId);
  const selectedElementId = useUIStore((s) => s.selectedElementId);
  const selectElement = useUIStore((s) => s.selectElement);
  const project = useProjectStore((s) => s.project);
  const updateElement = useProjectStore((s) => s.updateElement);
  const viewport = useViewportStore((s) => s.pageDesignViewport);
  const zoom = useViewportStore((s) => s.zoom);
  const pan = useViewportStore((s) => s.pan);

  const dragRef = useRef<{
    type: 'move' | 'resize';
    elementId: string;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    elemStartW: number;
    elemStartH: number;
    handle?: string;
  } | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = React.useState('default');

  const currentPage = project.pages.find((p) => p.id === currentPageId);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    renderPageDesignScene(ctx, canvas.width, canvas.height, currentPage, selectedElementId, viewport);
    animFrameRef.current = requestAnimationFrame(render);
  }, [currentPage, selectedElementId, viewport]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

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

  // 进入时自适应显示页面
  useEffect(() => {
    if (!currentPage || !containerRef.current) return;
    const container = containerRef.current;
    useViewportStore.getState().setViewport(
      'pageDesign',
      fitPageToViewport(currentPage, container.clientWidth, container.clientHeight),
    );
  }, [currentPageId]);

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
      if (e.button === 1) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (e.button !== 0 || !currentPage) return;

      const world = getWorldPos(e);

      // 检测是否点击了已选中元素的调整手柄
      if (selectedElementId) {
        const selected = currentPage.elements.find((el) => el.id === selectedElementId);
        if (selected) {
          const handle = hitTestHandle(
            { x: selected.x, y: selected.y, width: selected.width, height: selected.height },
            e.clientX - canvasRef.current!.getBoundingClientRect().left,
            e.clientY - canvasRef.current!.getBoundingClientRect().top,
            viewport.scale,
            viewport.offsetX,
            viewport.offsetY,
          );
          if (handle) {
            dragRef.current = {
              type: 'resize',
              elementId: selected.id,
              startX: e.clientX,
              startY: e.clientY,
              elemStartX: selected.x,
              elemStartY: selected.y,
              elemStartW: selected.width,
              elemStartH: selected.height,
              handle,
            };
            return;
          }
        }
      }

      // 检测点击元素
      const hitElement = hitTestElement(currentPage.elements, world.x, world.y);
      if (hitElement) {
        selectElement(hitElement.id);
        dragRef.current = {
          type: 'move',
          elementId: hitElement.id,
          startX: e.clientX,
          startY: e.clientY,
          elemStartX: hitElement.x,
          elemStartY: hitElement.y,
          elemStartW: hitElement.width,
          elemStartH: hitElement.height,
        };
      } else {
        selectElement(null);
      }
    },
    [getWorldPos, currentPage, selectedElementId, selectElement, viewport],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        pan('pageDesign', dx, dy);
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // 检测鼠标悬停位置以设置光标
      if (!dragRef.current && currentPage && selectedElementId) {
        const selected = currentPage.elements.find((el) => el.id === selectedElementId);
        if (selected && canvasRef.current) {
          const pointer = getCanvasPointerPosition(canvasRef.current, e.clientX, e.clientY);
          const handle = hitTestHandle(
            { x: selected.x, y: selected.y, width: selected.width, height: selected.height },
            pointer.x, pointer.y,
            viewport.scale, viewport.offsetX, viewport.offsetY,
          );
          if (handle) {
            setCursorStyle(getResizeCursor(handle));
          } else {
            const world = getWorldPos(e);
            const hitEl = hitTestElement(currentPage.elements, world.x, world.y);
            setCursorStyle(hitEl?.id === selectedElementId ? 'move' : 'default');
          }
        }
      }

      if (!dragRef.current || !currentPageId) return;
      const d = dragRef.current;

      if (d.type === 'move') {
        const dx = (e.clientX - d.startX) / viewport.scale;
        const dy = (e.clientY - d.startY) / viewport.scale;
        updateElement(currentPageId, d.elementId, {
          x: d.elemStartX + dx,
          y: d.elemStartY + dy,
        });
      } else if (d.type === 'resize' && d.handle) {
        const dx = (e.clientX - d.startX) / viewport.scale;
        const dy = (e.clientY - d.startY) / viewport.scale;
        const handle = d.handle;

        let newX = d.elemStartX;
        let newY = d.elemStartY;
        let newW = d.elemStartW;
        let newH = d.elemStartH;

        if (handle.includes('r')) newW = Math.max(10, d.elemStartW + dx);
        if (handle.includes('l')) {
          newX = d.elemStartX + dx;
          newW = Math.max(10, d.elemStartW - dx);
        }
        if (handle.includes('b')) newH = Math.max(10, d.elemStartH + dy);
        if (handle.includes('t')) {
          newY = d.elemStartY + dy;
          newH = Math.max(10, d.elemStartH - dy);
        }

        updateElement(currentPageId, d.elementId, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      }
    },
    [currentPageId, viewport.scale, updateElement, pan, currentPage, selectedElementId, getWorldPos],
  );

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    isPanning.current = false;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pointer = getCanvasPointerPosition(canvas, e.clientX, e.clientY);
      zoom('pageDesign', e.deltaY, pointer.x, pointer.y);
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
          cursor: dragRef.current?.type === 'resize' ? 'nwse-resize' : dragRef.current ? 'grabbing' : cursorStyle,
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
