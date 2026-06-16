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
  checkInternetConnection: () => ipcRenderer.invoke('cloud:check-internet')
});
