export interface ElectronAPI {
  login: (username: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  getRecords: () => Promise<any[]>;
  addRecord: (record: any) => Promise<any>;
  updateRecord: (id: string, fields: any) => Promise<any>;
  deleteRecord: (id: string) => Promise<any>;
  getMilestones: () => Promise<any[]>;
  addMilestone: (milestone: any) => Promise<any>;
  deleteMilestone: (id: string) => Promise<any>;
  resetDatabase: (shouldSeed?: boolean) => Promise<any>;
  getDbPath: () => Promise<string>;
  cloudBackupNow: () => Promise<any>;
  getCloudStatus: () => Promise<{ unsyncedCount: number; details: any; error?: string }>;
  checkInternetConnection: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
