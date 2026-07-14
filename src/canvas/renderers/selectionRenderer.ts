import { HANDLE_SIZE, HANDLE_FILL_COLOR, HANDLE_STROKE_COLOR, SELECTION_STROKE_COLOR, SELECTION_STROKE_WIDTH } from '@/utils/constants';

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandlePosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br';

interface Handle {
  x: number;
  y: number;
  position: HandlePosition;
}

export function renderSelection(
  ctx: CanvasRenderingContext2D,
  box: SelectionBox,
): void {
  const { x, y, width, height } = box;

  // 选中边框
  ctx.strokeStyle = SELECTION_STROKE_COLOR;
  ctx.lineWidth = SELECTION_STROKE_WIDTH;
  ctx.setLineDash([]);
  ctx.strokeRect(x, y, width, height);

  // 8 个手柄
  const handles = getHandles(box);
  for (const handle of handles) {
    ctx.fillStyle = HANDLE_FILL_COLOR;
    ctx.strokeStyle = HANDLE_STROKE_COLOR;
    ctx.lineWidth = 1;
    ctx.fillRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
    ctx.strokeRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
  }
}

export function getHandles(box: SelectionBox): Handle[] {
  const { x, y, width, height } = box;
  const hw = width / 2;
  const hh = height / 2;
  return [
    { x, y, position: 'tl' },
    { x: x + hw, y, position: 'tc' },
    { x: x + width, y, position: 'tr' },
    { x, y: y + hh, position: 'ml' },
    { x: x + width, y: y + hh, position: 'mr' },
    { x, y: y + height, position: 'bl' },
    { x: x + hw, y: y + height, position: 'bc' },
    { x: x + width, y: y + height, position: 'br' },
  ];
}

export function hitTestHandle(
  box: SelectionBox,
  screenX: number,
  screenY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): HandlePosition | null {
  const handles = getHandles(box);
  // 在屏幕坐标空间检测手柄
  for (const handle of handles) {
    const sx = handle.x * scale + offsetX;
    const sy = handle.y * scale + offsetY;
    const halfSize = HANDLE_SIZE / 2 + 2; // 加一点容差
    if (
      screenX >= sx - halfSize &&
      screenX <= sx + halfSize &&
      screenY >= sy - halfSize &&
      screenY <= sy + halfSize
    ) {
      return handle.position;
    }
  }
  return null;
}
