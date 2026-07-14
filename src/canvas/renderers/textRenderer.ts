import type { TextElement } from '@/types/project';

export function renderTextElement(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
): void {
  const { x, y, width, height, content, fontSize } = element;

  // 背景（浅色）
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(x, y, width, height);

  // 边框（虚线表示文字区域）
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);

  // 文字
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(content, x + 4, y + 4);
}
