import {
  createButtonElement,
  createDefaultPage,
  createObjectElement,
  createTextElement,
} from '@/types/project';
import type { BaseElement, Element, Link, Page, ProjectFile } from '@/types/project';

export function createPositionedPage(
  project: ProjectFile,
  pageId: string,
  title: string,
  width: number,
  height: number,
): Page {
  const existingCount = project.pages.length;
  const x = 100 + (existingCount % 4) * 400;
  const y = 100 + Math.floor(existingCount / 4) * 350;
  const isLandingPage = project.pages.length === 0;

  return createDefaultPage(pageId, title, width, height, x, y, isLandingPage);
}

export function removePageFromProject(project: ProjectFile, pageId: string): ProjectFile {
  const page = project.pages.find((item) => item.id === pageId);
  const wasLandingPage = page?.isLandingPage;

  let pages = project.pages.filter((item) => item.id !== pageId);
  const links = project.links.filter(
    (link) => link.sourcePageId !== pageId && link.targetPageId !== pageId,
  );

  if (wasLandingPage && pages.length > 0) {
    pages = pages.map((item, index) => (index === 0 ? { ...item, isLandingPage: true } : item));
  }

  return { ...project, pages, links };
}

export function updatePageInProject(
  project: ProjectFile,
  pageId: string,
  updates: Partial<Page>,
): ProjectFile {
  return {
    ...project,
    pages: project.pages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
  };
}

export function setLandingPageInProject(project: ProjectFile, pageId: string): ProjectFile {
  return {
    ...project,
    pages: project.pages.map((page) => ({
      ...page,
      isLandingPage: page.id === pageId,
    })),
  };
}

export function getNextPageElementZIndex(page: Page): number {
  if (page.elements.length === 0) return 1;
  return Math.max(...page.elements.map((element) => element.zIndex)) + 1;
}

export function createPageElement(
  page: Page,
  elementId: string,
  type: 'object' | 'text' | 'button',
): Element {
  const zIndex = getNextPageElementZIndex(page);

  switch (type) {
    case 'object':
      return createObjectElement(elementId, page.width / 2 - 100, page.height / 2 - 60, zIndex);
    case 'text':
      return createTextElement(elementId, page.width / 2 - 100, page.height / 2 - 20, zIndex);
    case 'button':
      return createButtonElement(elementId, page.width / 2 - 80, page.height / 2 - 24, zIndex);
  }
}

export function addElementToProject(project: ProjectFile, pageId: string, element: Element): ProjectFile {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId ? { ...page, elements: [...page.elements, element] } : page,
    ),
  };
}

export function removeElementFromProject(project: ProjectFile, pageId: string, elementId: string): ProjectFile {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId
        ? { ...page, elements: page.elements.filter((element) => element.id !== elementId) }
        : page,
    ),
    links: project.links.filter((link) => link.sourceElementId !== elementId),
  };
}

export function updateElementInProject(
  project: ProjectFile,
  pageId: string,
  elementId: string,
  updates: Partial<BaseElement>,
): ProjectFile {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            elements: page.elements.map((element) =>
              element.id === elementId ? ({ ...element, ...updates } as Element) : element,
            ),
          }
        : page,
    ),
  };
}

export function addLinkToProject(project: ProjectFile, link: Link): ProjectFile {
  return {
    ...project,
    links: [...project.links, link],
  };
}

export function removeLinkFromProject(project: ProjectFile, linkId: string): ProjectFile {
  return {
    ...project,
    links: project.links.filter((link) => link.id !== linkId),
  };
}