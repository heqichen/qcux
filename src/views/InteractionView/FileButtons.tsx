import React from 'react';
import { useProjectSave } from '../../hooks/useProjectSave';
import { useProjectStore } from '@/store/projectStore';
import { generateExportHTML } from '@/services/exportHtml';
import { exportProjectHtml, openProjectFile } from '@/services/projectFileService';
import { getProjectDisplayPath } from '@/utils/projectTitle';
import { btnStyle } from '@/views/InteractionView/styles';

export const FileButtons: React.FC = () => {
  const loadProject = useProjectStore((state) => state.loadProject);
  const isDirty = useProjectStore((state) => state.isDirty);
  const projectPath = useProjectStore((state) => state.projectPath);
  const project = useProjectStore((state) => state.project);
  const saveProject = useProjectSave();

  const handleOpen = async () => {
    try {
      if (isDirty) {
        const confirmed = window.confirm(`当前项目 ${getProjectDisplayPath(projectPath)} 有未保存的更改。打开其他项目会丢失这些更改，是否继续？`);
        if (!confirmed) {
          return;
        }
      }

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
      <button style={btnStyle} onClick={handleOpen}>📂 打开项目</button>
      <button style={btnStyle} onClick={handleSave}>💾 保存项目</button>
      <button style={btnStyle} onClick={handleExport}>📤 导出</button>
    </>
  );
};