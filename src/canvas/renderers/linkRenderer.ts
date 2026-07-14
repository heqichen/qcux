import type { Link, Page } from '@/types/project';
import { LINK_COLOR, LINK_ARROW_SIZE } from '@/utils/constants';
import { clamp, distance } from '@/utils/geometry';

const LINK_LINE_WIDTH = 3;
const LINK_START_MARKER_RADIUS = 6;

interface Point {
  x: number;
  y: number;
}

interface LinkPath {
  points: Point[];
  endAngle: number;
}

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

  const path = getLinkPathWorld(link, pages);
  if (!path) return;

  const screenPoints = path.points.map((point) => ({
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  }));

  ctx.strokeStyle = isSelected ? '#FF1744' : LINK_COLOR;
  ctx.lineWidth = isSelected ? LINK_LINE_WIDTH + 1 : LINK_LINE_WIDTH;
  ctx.setLineDash([]);
  drawPolyline(ctx, screenPoints);
  drawStartMarker(ctx, screenPoints[0]);
  drawArrowHead(ctx, screenPoints[screenPoints.length - 1].x, screenPoints[screenPoints.length - 1].y, path.endAngle);
}

// 绘制临时链接线（世界坐标，创建时跟随鼠标）
export function renderTempLinkLine(
  ctx: CanvasRenderingContext2D,
  fromWorldX: number,
  fromWorldY: number,
  mouseWorldX: number,
  mouseWorldY: number,
): void {
  const from = { x: fromWorldX, y: fromWorldY };
  const to = { x: mouseWorldX, y: mouseWorldY };
  const path = buildPolylineToPoint(from, to);

  ctx.strokeStyle = LINK_COLOR;
  ctx.lineWidth = LINK_LINE_WIDTH;
  ctx.setLineDash([6, 4]);
  drawPolyline(ctx, path.points);
  ctx.setLineDash([]);
  drawStartMarker(ctx, path.points[0]);
  drawArrowHead(ctx, to.x, to.y, path.endAngle);
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
    const path = getLinkPathWorld(link, pages);
    if (!path) continue;

    const screenPoints = path.points.map((point) => ({
      x: point.x * scale + offsetX,
      y: point.y * scale + offsetY,
    }));

    if (isPointNearPolyline(screenX, screenY, screenPoints, threshold)) {
      return link;
    }
  }
  return null;
}

function getLinkPathWorld(link: Link, pages: Page[]): LinkPath | null {
  const sourcePage = pages.find((p) => p.id === link.sourcePageId);
  const targetPage = pages.find((p) => p.id === link.targetPageId);
  if (!sourcePage || !targetPage) return null;

  const sourceElement = sourcePage.elements.find((e) => e.id === link.sourceElementId);
  const from = {
    x: sourcePage.x + (sourceElement ? sourceElement.x + sourceElement.width / 2 : sourcePage.width / 2),
    y: sourcePage.y + (sourceElement ? sourceElement.y + sourceElement.height / 2 : sourcePage.height / 2),
  };
  const targetAnchor = getTargetAnchor(from, targetPage);

  return buildPolylineToPoint(from, targetAnchor.point, targetAnchor.endAngle);
}

function getTargetAnchor(from: Point, targetPage: Page): { point: Point; endAngle: number } {
  const centerX = targetPage.x + targetPage.width / 2;
  const centerY = targetPage.y + targetPage.height / 2;
  const dx = from.x - centerX;
  const dy = from.y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (from.x < centerX) {
      return {
        point: {
          x: targetPage.x,
          y: clamp(from.y, targetPage.y, targetPage.y + targetPage.height),
        },
        endAngle: 0,
      };
    }

    return {
      point: {
        x: targetPage.x + targetPage.width,
        y: clamp(from.y, targetPage.y, targetPage.y + targetPage.height),
      },
      endAngle: Math.PI,
    };
  }

  if (from.y < centerY) {
    return {
      point: {
        x: clamp(from.x, targetPage.x, targetPage.x + targetPage.width),
        y: targetPage.y,
      },
      endAngle: Math.PI / 2,
    };
  }

  return {
    point: {
      x: clamp(from.x, targetPage.x, targetPage.x + targetPage.width),
      y: targetPage.y + targetPage.height,
    },
    endAngle: -Math.PI / 2,
  };
}

function buildPolylineToPoint(from: Point, to: Point, forcedEndAngle?: number): LinkPath {
  const endAngle = forcedEndAngle ?? getPointDirection(from, to);

  if (endAngle === 0 || endAngle === Math.PI) {
    const midX = (from.x + to.x) / 2;
    return {
      points: [
        from,
        { x: midX, y: from.y },
        { x: midX, y: to.y },
        to,
      ],
      endAngle,
    };
  }

  const midY = (from.y + to.y) / 2;
  return {
    points: [
      from,
      { x: from.x, y: midY },
      { x: to.x, y: midY },
      to,
    ],
    endAngle,
  };
}

function getPointDirection(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 0 : Math.PI;
  }

  return dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
}

function drawPolyline(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.stroke();
}

function drawStartMarker(ctx: CanvasRenderingContext2D, point: Point): void {
  const strokeColor = String(ctx.strokeStyle);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.max(2, ctx.lineWidth - 0.5);
  ctx.beginPath();
  ctx.arc(point.x, point.y, LINK_START_MARKER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function isPointNearPolyline(px: number, py: number, points: Point[], threshold: number): boolean {
  for (let index = 0; index < points.length - 1; index += 1) {
    if (distToSegment(px, py, points[index].x, points[index].y, points[index + 1].x, points[index + 1].y) < threshold) {
      return true;
    }
  }

  return false;
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
