import React, { useEffect, useRef } from 'react';
import { useProjectSave } from './hooks/useProjectSave';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { getProjectWindowTitle } from '@/utils/projectTitle';
import { InteractionToolbar, InteractionToolbox, AddPageDialog } from '@/views/InteractionView/InteractionView';
import { PageDesignToolbar, PageDesignToolbox } from '@/views/PageDesignView/PageDesignView';
import { InteractionCanvas } from '@/canvas/InteractionCanvas';
import { PageDesignCanvas } from '@/canvas/PageDesignCanvas';
import type { Page } from '@/types/project';

const App: React.FC = () => {
  const currentView = useUIStore((s) => s.currentView);
  const projectPath = useProjectStore((s) => s.projectPath);
  const isDirty = useProjectStore((s) => s.isDirty);
  const project = useProjectStore((s) => s.project);
  const duplicatePageFromSnapshot = useProjectStore((s) => s.duplicatePageFromSnapshot);
  const removeElement = useProjectStore((s) => s.removeElement);
  const selectedPageId = useUIStore((s) => s.selectedPageId);
  const currentPageId = useUIStore((s) => s.currentPageId);
  const selectedElementId = useUIStore((s) => s.selectedElementId);
  const selectPage = useUIStore((s) => s.selectPage);
  const selectElement = useUIStore((s) => s.selectElement);
  const saveProject = useProjectSave();
  const copiedPageRef = useRef<Page | null>(null);

  useEffect(() => {
    const title = getProjectWindowTitle(projectPath, isDirty);
    document.title = title;
    void window.electronAPI?.setWindowTitle?.(title);
  }, [isDirty, projectPath]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target?.isContentEditable;

      if (isEditableTarget) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveProject();
        return;
      }

      if (currentView === 'pageDesign' && event.key === 'Delete' && currentPageId && selectedElementId) {
        event.preventDefault();
        removeElement(currentPageId, selectedElementId);
        selectElement(null);
        return;
      }

      if (currentView !== 'interaction' || !(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (event.key.toLowerCase() === 'c') {
        const selectedPage = project.pages.find((page) => page.id === selectedPageId);
        if (!selectedPage) {
          return;
        }

        event.preventDefault();
        copiedPageRef.current = {
          ...selectedPage,
          elements: selectedPage.elements.map((element) => ({ ...element })),
        };
        return;
      }

      if (event.key.toLowerCase() === 'v' && copiedPageRef.current) {
        event.preventDefault();
        const duplicatedPage = duplicatePageFromSnapshot(copiedPageRef.current);
        selectPage(duplicatedPage.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentPageId,
    currentView,
    duplicatePageFromSnapshot,
    project.pages,
    removeElement,
    saveProject,
    selectElement,
    selectPage,
    selectedElementId,
    selectedPageId,
  ]);

  if (currentView === 'interaction') {
    return (
      <div style={appContainerStyle}>
        <InteractionToolbar />
        <div style={getMainAreaStyle('interaction')}>
          <InteractionCanvas />
          <InteractionToolbox />
        </div>
        <AddPageDialog />
      </div>
    );
  }

  return (
    <div style={appContainerStyle}>
      <PageDesignToolbar />
      <div style={getMainAreaStyle('pageDesign')}>
        <PageDesignCanvas />
        <PageDesignToolbox />
      </div>
    </div>
  );
};

const appContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
};

const baseMainAreaStyle: React.CSSProperties = {
  display: 'grid',
  flex: 1,
  overflow: 'hidden',
  minWidth: 0,
};

function getMainAreaStyle(view: 'interaction' | 'pageDesign'): React.CSSProperties {
  return {
    ...baseMainAreaStyle,
    gridTemplateColumns:
      view === 'interaction'
        ? 'minmax(0, 1fr) minmax(180px, 24vw)'
        : 'minmax(0, 1fr) minmax(220px, 28vw)',
  };
}

export default App;
