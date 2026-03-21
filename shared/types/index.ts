export type UserRole = 'SUPER_ADMIN' | 'COORDINATOR';

export interface AuthUser {
  id: string; name: string; email?: string; phone?: string; role: UserRole; token: string;
}

export type HackathonStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

export interface Hackathon {
  id: string; name: string; description?: string; startDate: string; endDate: string;
  status: HackathonStatus; venue?: string; maxTeams?: number; createdAt: string;
}

export type TeamStatus = 'REGISTERED' | 'CHECKED_IN' | 'ACTIVE' | 'SUBMITTED' | 'DISQUALIFIED';

export interface Participant {
  id: string; name: string; email?: string; phone?: string; isLeader: boolean;
}

export interface Team {
  id: string; hackathonId: string; name: string; status: TeamStatus;
  room?: string; tableNumber?: string; projectName?: string; projectUrl?: string;
  notes?: string; leaderPhone?: string; checkInTime?: string; submissionTime?: string;
  coordinatorId?: string; coordinator?: { id: string; name: string } | null;
  participants: Participant[]; createdAt: string; updatedAt: string;
}

export type MessageChannel = 'WHATSAPP' | 'SMS' | 'INTERNAL';
export type MessageStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'PENDING';

export type CertType = 'PARTICIPATION' | 'WINNER' | 'RUNNER_UP' | 'SPECIAL';
export type CertStatus = 'PENDING' | 'GENERATED' | 'SENT' | 'FAILED';

export interface HackathonMetrics {
  totalTeams: number; checkedIn: number; checkedInPercent: number;
  active: number; submitted: number; missing: number;
  totalParticipants: number; messagesToday: number;
}
