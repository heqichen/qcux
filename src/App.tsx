import React, { useEffect } from 'react';
import { useProjectSave } from './hooks/useProjectSave';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { getProjectWindowTitle } from '@/utils/projectTitle';
import { InteractionToolbar, InteractionToolbox, AddPageDialog } from '@/views/InteractionView/InteractionView';
import { PageDesignToolbar, PageDesignToolbox } from '@/views/PageDesignView/PageDesignView';
import { InteractionCanvas } from '@/canvas/InteractionCanvas';
import { PageDesignCanvas } from '@/canvas/PageDesignCanvas';

const App: React.FC = () => {
  const currentView = useUIStore((s) => s.currentView);
  const projectPath = useProjectStore((s) => s.projectPath);
  const isDirty = useProjectStore((s) => s.isDirty);
  const saveProject = useProjectSave();

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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveProject();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveProject]);

  if (currentView === 'interaction') {
    return (
      <div style={appContainerStyle}>
        <InteractionToolbar />
        <div style={mainAreaStyle}>
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
      <div style={mainAreaStyle}>
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

const mainAreaStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

export default App;
