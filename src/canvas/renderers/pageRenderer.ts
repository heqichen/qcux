import type { Page } from '@/types/project';
import {
  PAGE_BORDER_COLOR,
  PAGE_SELECTED_BORDER_COLOR,
  PAGE_BG_COLOR,
  SELECTION_STROKE_COLOR,
  SELECTION_STROKE_WIDTH,
} from '@/utils/constants';

export function renderPageThumbnail(
  ctx: CanvasRenderingContext2D,
  page: Page,
  isSelected: boolean,
): void {
  const { x, y, width, height } = page;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // 页面背景
  ctx.fillStyle = PAGE_BG_COLOR;
  ctx.fillRect(x, y, width, height);

  // 渲染页面内的元素（缩略）
  for (const element of page.elements) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x + element.x, y + element.y, element.width, element.height);
    ctx.strokeStyle = '#999';
    ctx.strokeRect(x + element.x, y + element.y, element.width, element.height);
  }

  ctx.restore();

  // 页面边框
  ctx.strokeStyle = isSelected ? PAGE_SELECTED_BORDER_COLOR : PAGE_BORDER_COLOR;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(x, y, width, height);

  // 选中时高亮边框
  if (isSelected) {
    ctx.strokeStyle = SELECTION_STROKE_COLOR;
    ctx.lineWidth = SELECTION_STROKE_WIDTH;
    ctx.strokeRect(x, y, width, height);
  }
}

export function renderPageCompositeScreenSpace(
  ctx: CanvasRenderingContext2D,
  page: Page,
  scale: number,
  offsetX: number,
  offsetY: number,
  isSelected: boolean,
): void {
  const sx = page.x * scale + offsetX;
  const sy = page.y * scale + offsetY;
  const sw = page.width * scale;
  const sh = page.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sy, sw, sh);
  ctx.clip();

  ctx.fillStyle = PAGE_BG_COLOR;
  ctx.fillRect(sx, sy, sw, sh);

  for (const element of page.elements) {
    const ex = sx + element.x * scale;
    const ey = sy + element.y * scale;
    const ew = element.width * scale;
    const eh = element.height * scale;

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(ex, ey, ew, eh);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(ex, ey, ew, eh);
  }

  ctx.restore();

  ctx.strokeStyle = isSelected ? PAGE_SELECTED_BORDER_COLOR : PAGE_BORDER_COLOR;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(sx, sy, sw, sh);

  if (isSelected) {
    ctx.strokeStyle = SELECTION_STROKE_COLOR;
    ctx.lineWidth = SELECTION_STROKE_WIDTH;
    ctx.strokeRect(sx, sy, sw, sh);
  }

  ctx.fillStyle = '#333333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(page.title, sx + sw / 2, sy - 6);

  if (page.isLandingPage) {
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🏠 Landing', sx, sy + sh + 4);
  }
}

export function renderPageDecorations(
  ctx: CanvasRenderingContext2D,
  page: Page,
  scale: number,
): void {
  const inverseScale = 1 / scale;

  const { x, y, width, title } = page;
  const titleX = x + width / 2;
  const titleY = y - 6 * inverseScale;

  ctx.fillStyle = '#333333';
  ctx.font = `bold ${15 * inverseScale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(title, titleX, titleY);

  if (page.isLandingPage) {
    const landingX = x;
    const landingY = y + page.height + 4 * inverseScale;
    ctx.fillStyle = '#FF9800';
    ctx.font = `bold ${14 * inverseScale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🏠 Landing', landingX, landingY);
  }
}
