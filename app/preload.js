// preload.js - expose pipInstall to renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  pipInstall: (packageName) => ipcRenderer.invoke('pip-install', packageName),
  // ...existing API methods (loadFlowConfig, saveFlowConfig) nếu có
});
