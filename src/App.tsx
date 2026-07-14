import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { InteractionToolbar, InteractionToolbox, AddPageDialog } from '@/views/InteractionView/InteractionView';
import { PageDesignToolbar, PageDesignToolbox } from '@/views/PageDesignView/PageDesignView';
import { InteractionCanvas } from '@/canvas/InteractionCanvas';
import { PageDesignCanvas } from '@/canvas/PageDesignCanvas';

const App: React.FC = () => {
  const currentView = useUIStore((s) => s.currentView);

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
