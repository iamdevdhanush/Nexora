// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'COORDINATOR';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  token: string;
}

// ─── Hackathon ────────────────────────────────────────────────────────────────
export type HackathonStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

export interface Hackathon {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: HackathonStatus;
  venue?: string;
  maxTeams?: number;
  createdAt: string;
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export type TeamStatus = 'REGISTERED' | 'CHECKED_IN' | 'ACTIVE' | 'SUBMITTED' | 'DISQUALIFIED';

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isLeader: boolean;
}

export interface Team {
  id: string;
  hackathonId: string;
  name: string;
  status: TeamStatus;
  room?: string;
  tableNumber?: string;
  projectName?: string;
  projectUrl?: string;
  notes?: string;
  leaderPhone?: string;
  checkInTime?: string;
  submissionTime?: string;
  coordinatorId?: string;
  coordinator?: { id: string; name: string } | null;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

// ─── Coordinator ──────────────────────────────────────────────────────────────
export interface Coordinator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  assignedTeamCount?: number;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────
export type MessageChannel = 'WHATSAPP' | 'SMS' | 'INTERNAL';
export type MessageStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'PENDING';

export interface BroadcastMessage {
  id: string;
  hackathonId: string;
  content: string;
  channel: MessageChannel;
  status: MessageStatus;
  recipientType: 'ALL' | 'SELECTED' | 'SINGLE';
  sentAt: string;
  sentBy: { id: string; name: string };
  sentCount: number;
  failedCount: number;
}

// ─── Certificate ──────────────────────────────────────────────────────────────
export type CertType = 'PARTICIPATION' | 'WINNER' | 'RUNNER_UP' | 'SPECIAL';
export type CertStatus = 'PENDING' | 'GENERATED' | 'SENT' | 'FAILED';

export interface Certificate {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  participantName: string;
  email: string;
  type: CertType;
  status: CertStatus;
  generatedAt?: string;
  sentAt?: string;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────
export interface HackathonMetrics {
  totalTeams: number;
  checkedIn: number;
  checkedInPercent: number;
  active: number;
  submitted: number;
  missing: number;
  totalParticipants: number;
  messagesToday: number;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
export interface WSEvent {
  type:
    | 'team:updated'
    | 'team:checkin'
    | 'metrics:updated'
    | 'broadcast:sent'
    | 'coordinator:assigned'
    | 'hackathon:updated';
  hackathonId: string;
  payload: unknown;
}
