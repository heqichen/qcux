export const APP_TITLE = 'QCUX - UX 线框图设计工具';
export const UNTITLED_PROJECT_NAME = 'Untitled';

export function getProjectDisplayPath(projectPath: string | null): string {
  return projectPath || UNTITLED_PROJECT_NAME;
}

export function getProjectWindowTitle(projectPath: string | null, isDirty: boolean): string {
  const dirtySuffix = isDirty ? ' •' : '';
  return `${getProjectDisplayPath(projectPath)}${dirtySuffix} - ${APP_TITLE}`;
}