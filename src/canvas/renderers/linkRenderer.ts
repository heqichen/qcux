import type { Link, Page } from '@/types/project';
import { LINK_COLOR, LINK_ARROW_SIZE } from '@/utils/constants';
import { distance } from '@/utils/geometry';

const LINK_LINE_WIDTH = 3;

// 在屏幕空间渲染链接线（固定粗细，不受缩放影响）
export function renderLinkScreenSpace(
  ctx: CanvasRenderingContext2D,
  link: Link,
  pages: Page[],
  scale: number,
  offsetX: number,
  offsetY: number,
  isSelected: boolean,
): void {
  const sourcePage = pages.find((p) => p.id === link.sourcePageId);
  const targetPage = pages.find((p) => p.id === link.targetPageId);
  if (!sourcePage || !targetPage) return;

  // 来源：源页面中元素的位置（元素中心）
  const sourceEl = sourcePage.elements.find((e) => e.id === link.sourceElementId);
  const swx = sourcePage.x + (sourceEl ? sourceEl.x + sourceEl.width / 2 : sourcePage.width / 2);
  const swy = sourcePage.y + (sourceEl ? sourceEl.y + sourceEl.height / 2 : sourcePage.height / 2);

  // 目标：目标页面左边框中点
  const twx = targetPage.x;
  const twy = targetPage.y + targetPage.height / 2;

  // 转换为屏幕坐标
  const sx = swx * scale + offsetX;
  const sy = swy * scale + offsetY;
  const tx = twx * scale + offsetX;
  const ty = twy * scale + offsetY;

  ctx.strokeStyle = isSelected ? '#FF1744' : LINK_COLOR;
  ctx.lineWidth = isSelected ? LINK_LINE_WIDTH + 1 : LINK_LINE_WIDTH;
  ctx.setLineDash([]);
  ctx.beginPath();

  const midX = tx - 50;
  ctx.moveTo(sx, sy);
  ctx.lineTo(midX, sy);
  ctx.lineTo(midX, ty);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  drawArrowHead(ctx, tx, ty, Math.PI);
}

// 绘制临时链接线（世界坐标，创建时跟随鼠标）
export function renderTempLinkLine(
  ctx: CanvasRenderingContext2D,
  fromWorldX: number,
  fromWorldY: number,
  mouseWorldX: number,
  mouseWorldY: number,
): void {
  ctx.strokeStyle = LINK_COLOR;
  ctx.lineWidth = LINK_LINE_WIDTH;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();

  const midX = mouseWorldX - 40;
  ctx.moveTo(fromWorldX, fromWorldY);
  ctx.lineTo(midX, fromWorldY);
  ctx.lineTo(midX, mouseWorldY);
  ctx.lineTo(mouseWorldX, mouseWorldY);
  ctx.stroke();
  ctx.setLineDash([]);
}

// 检测链接线是否被点击（屏幕坐标）
export function hitTestLinkScreenSpace(
  links: Link[],
  pages: Page[],
  scale: number,
  offsetX: number,
  offsetY: number,
  screenX: number,
  screenY: number,
): Link | null {
  const threshold = 8;

  for (const link of links) {
    const sourcePage = pages.find((p) => p.id === link.sourcePageId);
    const targetPage = pages.find((p) => p.id === link.targetPageId);
    if (!sourcePage || !targetPage) continue;

    const sourceEl = sourcePage.elements.find((e) => e.id === link.sourceElementId);
    const swx = sourcePage.x + (sourceEl ? sourceEl.x + sourceEl.width / 2 : sourcePage.width / 2);
    const swy = sourcePage.y + (sourceEl ? sourceEl.y + sourceEl.height / 2 : sourcePage.height / 2);
    const twx = targetPage.x;
    const twy = targetPage.y + targetPage.height / 2;

    const sx = swx * scale + offsetX;
    const sy = swy * scale + offsetY;
    const tx = twx * scale + offsetX;
    const ty = twy * scale + offsetY;
    const midX = tx - 50;

    if (distToSegment(screenX, screenY, sx, sy, midX, sy) < threshold ||
        distToSegment(screenX, screenY, midX, sy, midX, ty) < threshold ||
        distToSegment(screenX, screenY, midX, ty, tx, ty) < threshold) {
      return link;
    }
  }
  return null;
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + LINK_ARROW_SIZE * Math.cos(angle - Math.PI / 6),
    y + LINK_ARROW_SIZE * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x + LINK_ARROW_SIZE * Math.cos(angle + Math.PI / 6),
    y + LINK_ARROW_SIZE * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance({ x: px, y: py }, { x: x1, y: y1 });
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance({ x: px, y: py }, { x: x1 + t * dx, y: y1 + t * dy });
}
