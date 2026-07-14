import type { ButtonElement } from '@/types/project';

export function renderButtonElement(
  ctx: CanvasRenderingContext2D,
  element: ButtonElement,
): void {
  const { x, y, width, height, content, fontSize } = element;

  // 按钮背景
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(x, y, width, height);

  // 边框
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // 文字（居中，带下划线）
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textX = x + width / 2;
  const textY = y + height / 2;
  ctx.fillText(content, textX, textY);

  // 下划线
  const textMetrics = ctx.measureText(content);
  const underlineY = textY + fontSize / 2 + 2;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(textX - textMetrics.width / 2, underlineY);
  ctx.lineTo(textX + textMetrics.width / 2, underlineY);
  ctx.stroke();
}
