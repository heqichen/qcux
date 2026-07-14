import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultPath?: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  exportHTML: (defaultName?: string) => ipcRenderer.invoke('dialog:exportHTML', defaultName),
  setWindowTitle: (title: string) => ipcRenderer.send('window:setTitle', title),
});
