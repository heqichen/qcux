import { create } from 'zustand';
import {
  ProjectFile,
  Page,
  Element,
  Link,
  createDefaultProject,
  BaseElement,
} from '@/types/project';
import {
  addElementToProject,
  addLinkToProject,
  createPageElement,
  createPositionedPage,
  getNextPageElementZIndex,
  removeElementFromProject,
  removeLinkFromProject,
  removePageFromProject,
  setLandingPageInProject,
  updateElementInProject,
  updatePageInProject,
} from '@/store/projectStoreHelpers';
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
    const newPage = createPositionedPage(project, id, title, width, height);

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
    set({ project: removePageFromProject(project, pageId) });
  },

  updatePagePosition: (pageId, x, y) => {
    const { project } = get();
    set({ project: updatePageInProject(project, pageId, { x, y }) });
  },

  updatePageTitle: (pageId, title) => {
    const { project } = get();
    set({ project: updatePageInProject(project, pageId, { title }) });
  },

  setLandingPage: (pageId) => {
    const { project } = get();
    set({ project: setLandingPageInProject(project, pageId) });
  },

  getPageById: (pageId) => {
    return get().project.pages.find((p) => p.id === pageId);
  },

  addElement: (pageId, type) => {
    const { project } = get();
    const page = project.pages.find((p) => p.id === pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);

    const id = generateId();
    const element = createPageElement(page, id, type);

    set({ project: addElementToProject(project, pageId, element) });

    return element;
  },

  removeElement: (pageId, elementId) => {
    const { project } = get();
    set({ project: removeElementFromProject(project, pageId, elementId) });
  },

  updateElement: (pageId, elementId, updates) => {
    const { project } = get();
    set({ project: updateElementInProject(project, pageId, elementId, updates) });
  },

  getElementById: (pageId, elementId) => {
    const page = get().project.pages.find((p) => p.id === pageId);
    return page?.elements.find((e) => e.id === elementId);
  },

  getNextZIndex: (pageId) => {
    const page = get().project.pages.find((p) => p.id === pageId);
    if (!page || page.elements.length === 0) return 1;
    return getNextPageElementZIndex(page);
  },

  addLink: (sourcePageId, sourceElementId, targetPageId) => {
    const { project } = get();
    const id = generateId();
    const newLink: Link = { id, sourcePageId, sourceElementId, targetPageId };

    set({ project: addLinkToProject(project, newLink) });

    return newLink;
  },

  removeLink: (linkId) => {
    const { project } = get();
    set({ project: removeLinkFromProject(project, linkId) });
  },

  getLinksForPage: (pageId) => {
    return get().project.links.filter((l) => l.sourcePageId === pageId);
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__projectStore = useProjectStore;
}
