import type { ProjectFile } from '@/types/project';

export interface SaveProjectResult {
  didSave: boolean;
  path: string | null;
}

export async function openProjectFile(): Promise<{ data: ProjectFile; path: string } | null> {
  if (window.electronAPI) {
    const result = await window.electronAPI.openFile();
    if (!result) return null;

    return {
      data: JSON.parse(result.content) as ProjectFile,
      path: result.path,
    };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const text = await file.text();
      resolve({
        data: JSON.parse(text) as ProjectFile,
        path: file.name,
      });
    };
    input.click();
  });
}

export async function saveProjectFile(project: ProjectFile, projectPath: string | null): Promise<SaveProjectResult> {
  const json = JSON.stringify(project, null, 2);

  if (window.electronAPI) {
    if (projectPath) {
      const didWrite = await window.electronAPI.writeFile(projectPath, json);
      return { didSave: didWrite, path: didWrite ? projectPath : projectPath };
    }

    const nextPath = await window.electronAPI.saveFile();
    if (!nextPath) return { didSave: false, path: projectPath };

    const didWrite = await window.electronAPI.writeFile(nextPath, json);
    return { didSave: didWrite, path: didWrite ? nextPath : projectPath };
  }

  downloadFile(json, 'project.qcux.json', 'application/json');
  return { didSave: true, path: projectPath };
}

export async function exportProjectHtml(html: string, defaultName = 'export.html'): Promise<void> {
  if (window.electronAPI) {
    const path = await window.electronAPI.exportHTML(defaultName);
    if (path) {
      await window.electronAPI.writeFile(path, html);
    }
    return;
  }

  downloadFile(html, defaultName, 'text/html');
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}