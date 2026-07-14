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
  createDuplicatedElement,
  createDuplicatedPage,
  createPageElement,
  createPositionedPage,
  getNextPageElementZIndex,
  removeElementFromProject,
  removeLinkFromProject,
  removePageFromProject,
  setLandingPageInProject,
  updateElementInProject,
  updateLinkInProject,
  updatePageInProject,
} from '@/store/projectStoreHelpers';
import { generateId } from '@/utils/id';
import type { LinkTransition } from '@/types/project';

interface ProjectStore {
  // 状态
  project: ProjectFile;
  projectPath: string | null;
  isDirty: boolean;

  // 项目操作
  newProject: () => void;
  loadProject: (data: ProjectFile, path: string) => void;
  markProjectSaved: (data: ProjectFile, path?: string | null) => void;
  getSerializedProject: () => ProjectFile;
  updateProjectName: (name: string) => void;
  duplicatePageFromSnapshot: (sourcePage: Page) => Page;
  duplicateElementFromSnapshot: (pageId: string, sourceElement: Element, pasteCount: number) => Element;

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
  updateLink: (linkId: string, updates: Partial<Link>) => void;
  removeLink: (linkId: string) => void;
  getLinksForPage: (pageId: string) => Link[];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  projectPath: null,
  isDirty: false,

  newProject: () => {
    set({ project: createDefaultProject(), projectPath: null, isDirty: false });
  },

  loadProject: (data, path) => {
    set({
      project: {
        ...data,
        links: data.links.map((link) => ({
          ...link,
          transition: (link.transition ?? 'instant') as LinkTransition,
        })),
      },
      projectPath: path,
      isDirty: false,
    });
  },

  markProjectSaved: (data, path) => {
    set((state) => ({
      project: data,
      projectPath: path === undefined ? state.projectPath : path,
      isDirty: false,
    }));
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

  updateProjectName: (name) => {
    const { project } = get();
    set({
      project: {
        ...project,
        metadata: {
          ...project.metadata,
          name,
        },
      },
      isDirty: true,
    });
  },

  duplicatePageFromSnapshot: (sourcePage) => {
    const { project } = get();
    const nextPageId = generateId();
    const nextElementIds = sourcePage.elements.map(() => generateId());
    const duplicatedPage = createDuplicatedPage(sourcePage, nextPageId, nextElementIds);

    set({
      project: {
        ...project,
        pages: [...project.pages, duplicatedPage],
      },
      isDirty: true,
    });

    return duplicatedPage;
  },

  duplicateElementFromSnapshot: (pageId, sourceElement, pasteCount) => {
    const { project } = get();
    const page = project.pages.find((p) => p.id === pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);

    const nextElementId = generateId();
    const duplicatedElement = createDuplicatedElement(
      sourceElement,
      nextElementId,
      getNextPageElementZIndex(page),
      pasteCount,
    );

    set({
      project: addElementToProject(project, pageId, duplicatedElement),
      isDirty: true,
    });

    return duplicatedElement;
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
      isDirty: true,
    });

    return newPage;
  },

  removePage: (pageId) => {
    const { project } = get();
    set({ project: removePageFromProject(project, pageId), isDirty: true });
  },

  updatePagePosition: (pageId, x, y) => {
    const { project } = get();
    set({ project: updatePageInProject(project, pageId, { x, y }), isDirty: true });
  },

  updatePageTitle: (pageId, title) => {
    const { project } = get();
    set({ project: updatePageInProject(project, pageId, { title }), isDirty: true });
  },

  setLandingPage: (pageId) => {
    const { project } = get();
    set({ project: setLandingPageInProject(project, pageId), isDirty: true });
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

    set({ project: addElementToProject(project, pageId, element), isDirty: true });

    return element;
  },

  removeElement: (pageId, elementId) => {
    const { project } = get();
    set({ project: removeElementFromProject(project, pageId, elementId), isDirty: true });
  },

  updateElement: (pageId, elementId, updates) => {
    const { project } = get();
    set({ project: updateElementInProject(project, pageId, elementId, updates), isDirty: true });
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
    const newLink: Link = { id, sourcePageId, sourceElementId, targetPageId, transition: 'instant' };

    set({ project: addLinkToProject(project, newLink), isDirty: true });

    return newLink;
  },

  updateLink: (linkId, updates) => {
    const { project } = get();
    set({ project: updateLinkInProject(project, linkId, updates), isDirty: true });
  },

  removeLink: (linkId) => {
    const { project } = get();
    set({ project: removeLinkFromProject(project, linkId), isDirty: true });
  },

  getLinksForPage: (pageId) => {
    return get().project.links.filter((l) => l.sourcePageId === pageId);
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__projectStore = useProjectStore;
}
