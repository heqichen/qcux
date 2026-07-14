// ============================================================
// 项目数据模型 - 对应 JSON 文件格式
// ============================================================

export interface ProjectFile {
  version: string;
  metadata: {
    name: string;
    createdAt: string;
    modifiedAt: string;
  };
  pages: Page[];
  links: Link[];
}

export interface Page {
  id: string;
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isLandingPage: boolean;
  elements: Element[];
}

export interface Link {
  id: string;
  sourcePageId: string;
  sourceElementId: string;
  targetPageId: string;
  transition: LinkTransition;
}

export type LinkTransition = 'instant' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down';

export type ElementType = 'object' | 'text' | 'button';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface ObjectElement extends BaseElement {
  type: 'object';
  name: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  content: string;
  fontSize: number;
}

export type Element = ObjectElement | TextElement | ButtonElement;

// ============================================================
// 运行时 UI 状态
// ============================================================

export type ViewType = 'interaction' | 'pageDesign';

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// ============================================================
// 工具函数
// ============================================================

export function createDefaultProject(): ProjectFile {
  return {
    version: '1.0',
    metadata: {
      name: '未命名项目',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    pages: [],
    links: [],
  };
}

export function createDefaultPage(
  id: string,
  title: string,
  width: number,
  height: number,
  x: number,
  y: number,
  isLandingPage: boolean,
): Page {
  return { id, title, width, height, x, y, isLandingPage, elements: [] };
}

export function createObjectElement(
  id: string,
  x: number,
  y: number,
  zIndex: number,
): ObjectElement {
  return {
    id,
    type: 'object',
    x,
    y,
    width: 200,
    height: 120,
    zIndex,
    name: 'object',
  };
}

export function createTextElement(
  id: string,
  x: number,
  y: number,
  zIndex: number,
): TextElement {
  return {
    id,
    type: 'text',
    x,
    y,
    width: 200,
    height: 40,
    zIndex,
    content: 'TEXT',
    fontSize: 16,
  };
}

export function createButtonElement(
  id: string,
  x: number,
  y: number,
  zIndex: number,
): ButtonElement {
  return {
    id,
    type: 'button',
    x,
    y,
    width: 160,
    height: 48,
    zIndex,
    content: 'Button',
    fontSize: 16,
  };
}
