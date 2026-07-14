import type { Link, Page } from '@/types/project';
import { LINK_COLOR, LINK_WIDTH, LINK_ARROW_SIZE } from '@/utils/constants';

export function renderLink(
  ctx: CanvasRenderingContext2D,
  link: Link,
  pages: Page[],
): void {
  const sourcePage = pages.find((p) => p.id === link.sourcePageId);
  const targetPage = pages.find((p) => p.id === link.targetPageId);
  if (!sourcePage || !targetPage) return;

  // 从源页面中心出发
  const sx = sourcePage.x + sourcePage.width / 2;
  const sy = sourcePage.y + sourcePage.height / 2;

  // 到目标页面左侧中点
  const tx = targetPage.x;
  const ty = targetPage.y + targetPage.height / 2;

  // 绘制折线箭头
  ctx.strokeStyle = LINK_COLOR;
  ctx.lineWidth = LINK_WIDTH;
  ctx.setLineDash([]);
  ctx.beginPath();

  const midX = tx - 40; // 折线中间点
  ctx.moveTo(sx, sy);
  ctx.lineTo(midX, sy);
  ctx.lineTo(midX, ty);
  ctx.lineTo(tx, ty);

  ctx.stroke();

  // 箭头
  drawArrowHead(ctx, tx, ty, Math.PI);
}

export function renderTempLinkLine(
  ctx: CanvasRenderingContext2D,
  fromPage: Page,
  mouseWorldX: number,
  mouseWorldY: number,
): void {
  const sx = fromPage.x + fromPage.width / 2;
  const sy = fromPage.y + fromPage.height / 2;

  ctx.strokeStyle = LINK_COLOR;
  ctx.lineWidth = LINK_WIDTH;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();

  const midX = mouseWorldX - 40;
  ctx.moveTo(sx, sy);
  ctx.lineTo(midX, sy);
  ctx.lineTo(midX, mouseWorldY);
  ctx.lineTo(mouseWorldX, mouseWorldY);

  ctx.stroke();
  ctx.setLineDash([]);
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.fillStyle = LINK_COLOR;
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
