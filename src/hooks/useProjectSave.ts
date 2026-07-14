import { useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { saveProjectFile } from '@/services/projectFileService';

export function useProjectSave(): () => Promise<boolean> {
  const markProjectSaved = useProjectStore((state) => state.markProjectSaved);
  const getSerializedProject = useProjectStore((state) => state.getSerializedProject);
  const projectPath = useProjectStore((state) => state.projectPath);

  return useCallback(async () => {
    const data = getSerializedProject();
    const result = await saveProjectFile(data, projectPath);
    if (!result.didSave) {
      return false;
    }

    markProjectSaved(data, result.path);
    return true;
  }, [getSerializedProject, markProjectSaved, projectPath]);
}