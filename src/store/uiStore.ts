import { create } from 'zustand';
import type { ViewType } from '@/types/project';

interface UIStore {
  currentView: ViewType;
  currentPageId: string | null;
  selectedPageId: string | null;
  selectedElementId: string | null;
  selectedLinkId: string | null;
  isDirty: boolean;
  isAddPageDialogOpen: boolean;
  isLinkCreationMode: boolean;
  linkSourcePageId: string | null;
  linkSourceElementId: string | null;

  navigateToInteraction: () => void;
  navigateToPageDesign: (pageId: string) => void;
  selectPage: (pageId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  selectLink: (linkId: string | null) => void;
  openAddPageDialog: () => void;
  closeAddPageDialog: () => void;
  startLinkCreation: (pageId: string, elementId: string) => void;
  cancelLinkCreation: () => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'interaction',
  currentPageId: null,
  selectedPageId: null,
  selectedElementId: null,
  selectedLinkId: null,
  isDirty: false,
  isAddPageDialogOpen: false,
  isLinkCreationMode: false,
  linkSourcePageId: null,
  linkSourceElementId: null,

  selectedLinkId: null,

  navigateToInteraction: () => {
    set({
      currentView: 'interaction',
      currentPageId: null,
      selectedElementId: null,
      selectedLinkId: null,
      isLinkCreationMode: false,
      linkSourcePageId: null,
      linkSourceElementId: null,
    });
  },

  navigateToPageDesign: (pageId) => {
    set({
      currentView: 'pageDesign',
      currentPageId: pageId,
      selectedPageId: null,
      selectedElementId: null,
    });
  },

  selectPage: (pageId) => {
    set({ selectedPageId: pageId, selectedLinkId: null });
  },

  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },

  selectLink: (linkId) => {
    set({ selectedLinkId: linkId, selectedPageId: null });
  },

  openAddPageDialog: () => {
    set({ isAddPageDialogOpen: true });
  },

  closeAddPageDialog: () => {
    set({ isAddPageDialogOpen: false });
  },

  startLinkCreation: (pageId, elementId) => {
    set({
      isLinkCreationMode: true,
      linkSourcePageId: pageId,
      linkSourceElementId: elementId,
    });
  },

  cancelLinkCreation: () => {
    set({
      isLinkCreationMode: false,
      linkSourcePageId: null,
      linkSourceElementId: null,
    });
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));
