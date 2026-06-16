const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  register: (userData) => ipcRenderer.invoke('auth:register', userData),
  updateProfile: (data) => ipcRenderer.invoke('auth:update-profile', data),
  
  // Records
  getRecords: () => ipcRenderer.invoke('records:get-all'),
  addRecord: (record) => ipcRenderer.invoke('records:add', record),
  updateRecord: (id, fields) => ipcRenderer.invoke('records:update', id, fields),
  deleteRecord: (id) => ipcRenderer.invoke('records:delete', id),
  
  // Milestones
  getMilestones: () => ipcRenderer.invoke('milestones:get-all'),
  addMilestone: (milestone) => ipcRenderer.invoke('milestones:add', milestone),
  deleteMilestone: (id) => ipcRenderer.invoke('milestones:delete', id),
  
  // System
  resetDatabase: (shouldSeed) => ipcRenderer.invoke('system:reset-db', shouldSeed),
  getDbPath: () => ipcRenderer.invoke('system:get-db-path'),
  
  // Cloud Backup
  cloudBackupNow: () => ipcRenderer.invoke('cloud:backup-now'),
  getCloudStatus: () => ipcRenderer.invoke('cloud:get-status'),
  checkInternetConnection: () => ipcRenderer.invoke('cloud:check-internet'),

  // Auto-Updater — Actions
  updaterStartDownload: () => ipcRenderer.invoke('updater:start-download'),
  updaterInstallNow: () => ipcRenderer.invoke('updater:install-now'),
  updaterCheckNow: () => ipcRenderer.invoke('updater:check-now'),

  // Auto-Updater — Event listeners (main -> renderer)
  onUpdateAvailable: (callback) => ipcRenderer.on('updater:update-available', (_e, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('updater:up-to-date', () => callback()),
  onDownloadProgress: (callback) => ipcRenderer.on('updater:download-progress', (_e, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('updater:update-downloaded', (_e, info) => callback(info)),
  onUpdaterError: (callback) => ipcRenderer.on('updater:error', (_e, err) => callback(err)),

  // Remove listeners to avoid memory leaks
  removeUpdaterListeners: () => {
    ipcRenderer.removeAllListeners('updater:update-available');
    ipcRenderer.removeAllListeners('updater:up-to-date');
    ipcRenderer.removeAllListeners('updater:download-progress');
    ipcRenderer.removeAllListeners('updater:update-downloaded');
    ipcRenderer.removeAllListeners('updater:error');
  }
});

