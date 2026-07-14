export {};

declare global {
  interface Window {
    electronAPI?: {
      openFile: () => Promise<{ path: string; content: string } | null>;
      saveFile: (defaultPath?: string) => Promise<string | null>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      exportHTML: (defaultName?: string) => Promise<string | null>;
      setWindowTitle?: (title: string) => void;
    };
  }
}
