import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { generateExportHTML } from '@/services/exportHtml';
import { exportProjectHtml, openProjectFile, saveProjectFile } from '@/services/projectFileService';
import { btnStyle } from '@/views/InteractionView/styles';

export const FileButtons: React.FC = () => {
  const loadProject = useProjectStore((state) => state.loadProject);
  const getSerializedProject = useProjectStore((state) => state.getSerializedProject);
  const projectPath = useProjectStore((state) => state.projectPath);
  const project = useProjectStore((state) => state.project);

  const handleOpen = async () => {
    try {
      const result = await openProjectFile();
      if (result) {
        loadProject(result.data, result.path);
      }
    } catch (err) {
      console.error('打开文件失败:', err);
    }
  };

  const handleSave = async () => {
    try {
      const data = getSerializedProject();
      const nextPath = await saveProjectFile(data, projectPath);
      if (nextPath && nextPath !== projectPath) {
        loadProject(data, nextPath);
      }
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
      <button style={btnStyle} onClick={handleOpen}>📂 打开项目</button>
      <button style={btnStyle} onClick={handleSave}>💾 保存项目</button>
      <button style={btnStyle} onClick={handleExport}>📤 导出</button>
    </>
  );
};