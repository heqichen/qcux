import React from 'react';
import { useProjectSave } from '../../hooks/useProjectSave';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useViewportStore } from '@/store/viewportStore';
import { generateExportHTML } from '@/services/exportHtml';
import { exportProjectHtml, openProjectFile } from '@/services/projectFileService';
import { getProjectDisplayPath } from '@/utils/projectTitle';
import { btnStyle } from '@/views/InteractionView/styles';

export const FileButtons: React.FC = () => {
  const loadProject = useProjectStore((state) => state.loadProject);
  const newProject = useProjectStore((state) => state.newProject);
  const isDirty = useProjectStore((state) => state.isDirty);
  const projectPath = useProjectStore((state) => state.projectPath);
  const project = useProjectStore((state) => state.project);
  const resetForNewProject = useUIStore((state) => state.resetForNewProject);
  const resetViewport = useViewportStore((state) => state.resetViewport);
  const saveProject = useProjectSave();

  const confirmDiscardChanges = () => {
    if (!isDirty) {
      return true;
    }

    return window.confirm(`当前项目 ${getProjectDisplayPath(projectPath)} 有未保存的更改。继续操作会丢失这些更改，是否继续？`);
  };

  const handleNewProject = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    newProject();
    resetForNewProject();
    resetViewport('interaction');
    resetViewport('pageDesign');
  };

  const handleOpen = async () => {
    try {
      if (!confirmDiscardChanges()) {
        return;
      }

      const result = await openProjectFile();
      if (result) {
        loadProject(result.data, result.path);
        resetForNewProject();
        resetViewport('interaction');
        resetViewport('pageDesign');
      }
    } catch (err) {
      console.error('打开文件失败:', err);
    }
  };

  const handleSave = async () => {
    try {
      await saveProject();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleExport = async () => {
    try {
      await exportProjectHtml(generateExportHTML(project));
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  return (
    <>
      <button style={btnStyle} onClick={handleNewProject}>📄 新建项目</button>
      <button style={btnStyle} onClick={handleOpen}>📂 打开项目</button>
      <button style={btnStyle} onClick={handleSave}>💾 保存项目</button>
      <button style={btnStyle} onClick={handleExport}>📤 导出</button>
    </>
  );
};