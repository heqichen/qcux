import type { Page, Element } from '@/types/project';
import { rectContainsPoint } from '@/utils/geometry';

export function hitTestPage(
  pages: Page[],
  worldX: number,
  worldY: number,
): Page | null {
  // 从上层开始检测（最后渲染的在最上面）
  for (let i = pages.length - 1; i >= 0; i--) {
    const page = pages[i];
    if (
      rectContainsPoint(
        { x: page.x, y: page.y, width: page.width, height: page.height },
        { x: worldX, y: worldY },
      )
    ) {
      return page;
    }
  }
  return null;
}

export function hitTestElement(
  elements: Element[],
  worldX: number,
  worldY: number,
): Element | null {
  // 按 zIndex 降序检测（最高层级优先）
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  for (const element of sorted) {
    if (
      rectContainsPoint(
        { x: element.x, y: element.y, width: element.width, height: element.height },
        { x: worldX, y: worldY },
      )
    ) {
      return element;
    }
  }
  return null;
}
