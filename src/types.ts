export type ServiceStatus = 'Completed' | 'Active' | 'Pending Review';

export interface ServiceRecord {
  id: string; // Unique ID (server-side, or client temporary)
  firstName: string;
  lastName: string;
  personnelId: string;
  serviceDate: string;
  serviceType: string;
  summary: string;
  status: ServiceStatus;
  timestamp: string;
  synced?: boolean; // For offline synchronization logic
}

export type MilestoneType = 'Promotion' | 'Certification' | 'Commendation' | 'Onboarding';

export interface HumanMilestone {
  id: string;
  personnelId: string;
  type: MilestoneType;
  title: string;
  description: string;
  date: string;
}

export interface UserProfile {
  username: string;
  name: string;
  personnelId: string;
  role: string;
  bloodType?: string;
  firstName?: string;
  lastName?: string;
  photoBase64?: string;
}

export interface PersonnelProfile {
  id: string;
  name: string;
  rank: string;
  squad: string;
  photoUrl: string;
  yearsOfService: number;
  incidentsLogged: number;
  commendationsCount: number;
  bloodType: string;
  certifications: string[];
}
