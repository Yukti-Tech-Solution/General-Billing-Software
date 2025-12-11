const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbInit: () => ipcRenderer.invoke('db-init'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbTransaction: (operations) => ipcRenderer.invoke('db-transaction', operations),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});

