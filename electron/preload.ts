import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  // File operations
  saveProject: (projectData: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadProject: () => Promise<{ success: boolean; data?: any; error?: string }>;
  importAudioFile: () => Promise<{ success: boolean; filePaths?: string[]; error?: string }>;
  
  // Audio device management
  getAudioDevices: () => Promise<{ inputDevices: any[]; outputDevices: any[] }>;
  
  // Menu event listeners
  onMenuAction: (callback: (action: string) => void) => void;
  removeMenuListeners: () => void;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  saveProject: (projectData: any) => ipcRenderer.invoke('save-project', projectData),
  loadProject: () => ipcRenderer.invoke('load-project'),
  importAudioFile: () => ipcRenderer.invoke('import-audio-file'),
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  
  onMenuAction: (callback: (action: string) => void) => {
    const menuActions = [
      'menu-new-project',
      'menu-open-project',
      'menu-save-project',
      'menu-import-audio',
      'menu-export-mix',
      'menu-audio-settings',
      'menu-midi-settings',
    ];
    
    menuActions.forEach(action => {
      ipcRenderer.on(action, () => callback(action));
    });
  },
  
  removeMenuListeners: () => {
    const menuActions = [
      'menu-new-project',
      'menu-open-project',
      'menu-save-project',
      'menu-import-audio',
      'menu-export-mix',
      'menu-audio-settings',
      'menu-midi-settings',
    ];
    
    menuActions.forEach(action => {
      ipcRenderer.removeAllListeners(action);
    });
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
