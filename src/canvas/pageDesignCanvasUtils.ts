import { renderButtonElement } from '@/canvas/renderers/buttonRenderer';
import { renderObjectElement } from '@/canvas/renderers/objectRenderer';
import { renderSelection } from '@/canvas/renderers/selectionRenderer';
import { renderTextElement } from '@/canvas/renderers/textRenderer';
import { CANVAS_BG_COLOR, PAGE_BG_COLOR, PAGE_BORDER_COLOR } from '@/utils/constants';
import type { Page, Viewport } from '@/types/project';

export interface CanvasPoint {
  x: number;
  y: number;
}

export function renderPageDesignScene(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentPage: Page,
  selectedElementId: string | null,
  viewport: Viewport,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = CANVAS_BG_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  ctx.fillStyle = PAGE_BG_COLOR;
  ctx.fillRect(0, 0, currentPage.width, currentPage.height);
  ctx.strokeStyle = PAGE_BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, currentPage.width, currentPage.height);

  const sortedElements = [...currentPage.elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const element of sortedElements) {
    switch (element.type) {
      case 'object':
        renderObjectElement(ctx, element);
        break;
      case 'text':
        renderTextElement(ctx, element);
        break;
      case 'button':
        renderButtonElement(ctx, element);
        break;
    }
  }

  if (selectedElementId) {
    const selected = currentPage.elements.find((element) => element.id === selectedElementId);
    if (selected) {
      renderSelection(ctx, {
        x: selected.x,
        y: selected.y,
        width: selected.width,
        height: selected.height,
      });
    }
  }

  ctx.restore();
}

export function getCanvasPointerPosition(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function fitPageToViewport(
  page: Page,
  containerWidth: number,
  containerHeight: number,
): Viewport {
  const scale = Math.min(
    (containerWidth - 80) / page.width,
    (containerHeight - 80) / page.height,
    1,
  );

  return {
    scale,
    offsetX: (containerWidth - page.width * scale) / 2,
    offsetY: (containerHeight - page.height * scale) / 2,
  };
}

export function getResizeCursor(handle: string): string {
  const cursorMap: Record<string, string> = {
    tl: 'nwse-resize',
    tc: 'ns-resize',
    tr: 'nesw-resize',
    ml: 'ew-resize',
    mr: 'ew-resize',
    bl: 'nesw-resize',
    bc: 'ns-resize',
    br: 'nwse-resize',
  };

  return cursorMap[handle] || 'default';
}