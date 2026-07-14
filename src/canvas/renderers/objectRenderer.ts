import type { ObjectElement } from '@/types/project';

export function renderObjectElement(
  ctx: CanvasRenderingContext2D,
  element: ObjectElement,
): void {
  const { x, y, width, height, name } = element;

  // 填充背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);

  // 边框
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // 对角线
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y + height);
  ctx.moveTo(x + width, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();

  // 居中名称
  ctx.fillStyle = '#333333';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + width / 2, y + height / 2);
}
