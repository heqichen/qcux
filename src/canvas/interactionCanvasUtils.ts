import { renderLinkScreenSpace, renderTempLinkLine } from '@/canvas/renderers/linkRenderer';
import {
  renderPageCompositeScreenSpace,
} from '@/canvas/renderers/pageRenderer';
import { CANVAS_BG_COLOR, GRID_COLOR, GRID_SIZE } from '@/utils/constants';
import type { Page, ProjectFile, Viewport } from '@/types/project';

export interface InteractionCanvasPoint {
  x: number;
  y: number;
}

export interface InteractionDragState {
  pageId: string | null;
  startX: number;
  startY: number;
  pageStartX: number;
  pageStartY: number;
}

interface RenderInteractionSceneArgs {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  project: ProjectFile;
  selectedPageId: string | null;
  selectedLinkId: string | null;
  viewport: Viewport;
  isLinkCreationMode: boolean;
  linkSourcePageId: string | null;
  linkSourceElementId: string | null;
  mouseWorld: InteractionCanvasPoint;
}

export function renderInteractionScene({
  ctx,
  canvasWidth,
  canvasHeight,
  project,
  selectedPageId,
  selectedLinkId,
  viewport,
  isLinkCreationMode,
  linkSourcePageId,
  linkSourceElementId,
  mouseWorld,
}: RenderInteractionSceneArgs): void {
  const selectedPage = project.pages.find((page) => page.id === selectedPageId) ?? null;
  const unselectedPages = project.pages.filter((page) => page.id !== selectedPageId);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = CANVAS_BG_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  drawGrid(
    ctx,
    canvasWidth / viewport.scale,
    canvasHeight / viewport.scale,
    viewport.offsetX,
    viewport.offsetY,
    viewport.scale,
  );

  if (isLinkCreationMode && linkSourcePageId) {
    const sourcePoint = getLinkSourceWorldPoint(project.pages, linkSourcePageId, linkSourceElementId);
    if (sourcePoint) {
      renderTempLinkLine(ctx, sourcePoint.x, sourcePoint.y, mouseWorld.x, mouseWorld.y);
    }
  }

  ctx.restore();

  for (const page of unselectedPages) {
    renderPageCompositeScreenSpace(
      ctx,
      page,
      viewport.scale,
      viewport.offsetX,
      viewport.offsetY,
      false,
    );
  }

  for (const link of project.links) {
    renderLinkScreenSpace(
      ctx,
      link,
      project.pages,
      viewport.scale,
      viewport.offsetX,
      viewport.offsetY,
      link.id === selectedLinkId,
    );
  }

  if (selectedPage) {
    renderPageCompositeScreenSpace(
      ctx,
      selectedPage,
      viewport.scale,
      viewport.offsetX,
      viewport.offsetY,
      true,
    );
  }
}

export function getCanvasPointerPosition(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): InteractionCanvasPoint {
  const rect = canvas.getBoundingClientRect();

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function getLinkSourceWorldPoint(
  pages: Page[],
  sourcePageId: string,
  sourceElementId: string | null,
): InteractionCanvasPoint | null {
  const sourcePage = pages.find((page) => page.id === sourcePageId);
  if (!sourcePage) return null;

  const sourceElement = sourcePage.elements.find((element) => element.id === sourceElementId);

  return {
    x: sourcePage.x + (sourceElement ? sourceElement.x + sourceElement.width / 2 : sourcePage.width / 2),
    y: sourcePage.y + (sourceElement ? sourceElement.y + sourceElement.height / 2 : sourcePage.height / 2),
  };
}

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