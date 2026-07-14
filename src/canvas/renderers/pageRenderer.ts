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

// Landing Page 标识在屏幕空间渲染，固定字体大小，不受缩放影响
export function renderLandingTagScreenSpace(
  ctx: CanvasRenderingContext2D,
  page: Page,
  scale: number,
  offsetX: number,
  offsetY: number,
): void {
  const sx = page.x * scale + offsetX;
  const sy = (page.y + page.height) * scale + offsetY;
  ctx.fillStyle = '#FF9800';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('🏠 Landing', sx, sy + 4);
}

// 页面标题在屏幕空间渲染，固定字体大小，不受缩放影响
export function renderPageTitleScreenSpace(
  ctx: CanvasRenderingContext2D,
  page: Page,
  scale: number,
  offsetX: number,
  offsetY: number,
): void {
  const { x, y, width, title } = page;
  const sx = (x + width / 2) * scale + offsetX;
  const sy = y * scale + offsetY;
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(title, sx, sy - 6);
}
