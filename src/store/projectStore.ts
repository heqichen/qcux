import { create } from 'zustand';
import {
  ProjectFile,
  Page,
  Element,
  ObjectElement,
  TextElement,
  ButtonElement,
  Link,
  createDefaultProject,
  createDefaultPage,
  createObjectElement,
  createTextElement,
  createButtonElement,
  BaseElement,
} from '@/types/project';
import { generateId } from '@/utils/id';

interface ProjectStore {
  // 状态
  project: ProjectFile;
  projectPath: string | null;

  // 项目操作
  newProject: () => void;
  loadProject: (data: ProjectFile, path: string) => void;
  getSerializedProject: () => ProjectFile;

  // 页面操作
  addPage: (title: string, width: number, height: number) => Page;
  removePage: (pageId: string) => void;
  updatePagePosition: (pageId: string, x: number, y: number) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  setLandingPage: (pageId: string) => void;
  getPageById: (pageId: string) => Page | undefined;

  // 元素操作
  addElement: (pageId: string, type: 'object' | 'text' | 'button') => Element;
  removeElement: (pageId: string, elementId: string) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<BaseElement>) => void;
  getElementById: (pageId: string, elementId: string) => Element | undefined;
  getNextZIndex: (pageId: string) => number;

  // 链接操作
  addLink: (sourcePageId: string, sourceElementId: string, targetPageId: string) => Link;
  removeLink: (linkId: string) => void;
  getLinksForPage: (pageId: string) => Link[];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  projectPath: null,

  newProject: () => {
    set({ project: createDefaultProject(), projectPath: null });
  },

  loadProject: (data, path) => {
    set({ project: data, projectPath: path });
  },

  getSerializedProject: () => {
    const project = get().project;
    return {
      ...project,
      metadata: {
        ...project.metadata,
        modifiedAt: new Date().toISOString(),
      },
    };
  },

  addPage: (title, width, height) => {
    const { project } = get();
    const id = generateId();

    // 计算新页面的位置（排布在已有页面之后）
    const existingCount = project.pages.length;
    const x = 100 + (existingCount % 4) * 400;
    const y = 100 + Math.floor(existingCount / 4) * 350;

    const isLandingPage = project.pages.length === 0;
    const newPage = createDefaultPage(id, title, width, height, x, y, isLandingPage);

    set({
      project: {
        ...project,
        pages: [...project.pages, newPage],
      },
    });

    return newPage;
  },

  removePage: (pageId) => {
    const { project } = get();
    const page = project.pages.find((p) => p.id === pageId);
    const wasLandingPage = page?.isLandingPage;

    let pages = project.pages.filter((p) => p.id !== pageId);
    const links = project.links.filter(
      (l) => l.sourcePageId !== pageId && l.targetPageId !== pageId,
    );

    // 如果删除的是 landing page，设置第一个页面为 landing page
    if (wasLandingPage && pages.length > 0) {
      pages = pages.map((p, i) => (i === 0 ? { ...p, isLandingPage: true } : p));
    }

    set({ project: { ...project, pages, links } });
  },

  updatePagePosition: (pageId, x, y) => {
    const { project } = get();
    set({
      project: {
        ...project,
        pages: project.pages.map((p) => (p.id === pageId ? { ...p, x, y } : p)),
      },
    });
  },

  updatePageTitle: (pageId, title) => {
    const { project } = get();
    set({
      project: {
        ...project,
        pages: project.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
      },
    });
  },

  setLandingPage: (pageId) => {
    const { project } = get();
    set({
      project: {
        ...project,
        pages: project.pages.map((p) => ({
          ...p,
          isLandingPage: p.id === pageId,
        })),
      },
    });
  },

  getPageById: (pageId) => {
    return get().project.pages.find((p) => p.id === pageId);
  },

  addElement: (pageId, type) => {
    const { project } = get();
    const page = project.pages.find((p) => p.id === pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);

    const id = generateId();
    const zIndex = page.elements.length === 0 ? 1 : Math.max(...page.elements.map((e) => e.zIndex)) + 1;

    // 在页面内居中放置新元素
    let element: Element;
    switch (type) {
      case 'object':
        element = createObjectElement(id, page.width / 2 - 100, page.height / 2 - 60, zIndex);
        break;
      case 'text':
        element = createTextElement(id, page.width / 2 - 100, page.height / 2 - 20, zIndex);
        break;
      case 'button':
        element = createButtonElement(id, page.width / 2 - 80, page.height / 2 - 24, zIndex);
        break;
    }

    set({
      project: {
        ...project,
        pages: project.pages.map((p) =>
          p.id === pageId ? { ...p, elements: [...p.elements, element] } : p,
        ),
      },
    });

    return element;
  },

  removeElement: (pageId, elementId) => {
    const { project } = get();
    set({
      project: {
        ...project,
        pages: project.pages.map((p) =>
          p.id === pageId
            ? { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
            : p,
        ),
        links: project.links.filter((l) => l.sourceElementId !== elementId),
      },
    });
  },

  updateElement: (pageId, elementId, updates) => {
    const { project } = get();
    set({
      project: {
        ...project,
        pages: project.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                elements: p.elements.map((e) =>
                  e.id === elementId ? ({ ...e, ...updates } as Element) : e,
                ),
              }
            : p,
        ),
      },
    });
  },

  getElementById: (pageId, elementId) => {
    const page = get().project.pages.find((p) => p.id === pageId);
    return page?.elements.find((e) => e.id === elementId);
  },

  getNextZIndex: (pageId) => {
    const page = get().project.pages.find((p) => p.id === pageId);
    if (!page || page.elements.length === 0) return 1;
    return Math.max(...page.elements.map((e) => e.zIndex)) + 1;
  },

  addLink: (sourcePageId, sourceElementId, targetPageId) => {
    const { project } = get();
    const id = generateId();
    const newLink: Link = { id, sourcePageId, sourceElementId, targetPageId };

    set({
      project: {
        ...project,
        links: [...project.links, newLink],
      },
    });

    return newLink;
  },

  removeLink: (linkId) => {
    const { project } = get();
    set({
      project: {
        ...project,
        links: project.links.filter((l) => l.id !== linkId),
      },
    });
  },

  getLinksForPage: (pageId) => {
    return get().project.links.filter((l) => l.sourcePageId === pageId);
  },
}));
