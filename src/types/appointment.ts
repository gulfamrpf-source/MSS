export interface SMSDeliveryStatus {
  sent: boolean;
  status: 'DELIVERED' | 'FAILED' | 'CONFIG_REQUIRED' | 'PENDING';
  sentAt?: string;
  recipientNumber: string;
  messageContent: string;
  messageId?: string;
  provider?: string;
  error?: string;
  retryCount: number;
  lastAttemptAt?: string;
}

export interface AppointmentLetterData {
  id?: string;
  refNumber: string; // e.g. MSS/HO/APPT/2026/001
  officerId: string; // e.g. MSS-OFF-0042
  userId: string;
  officerName: string;
  officerEmail?: string;
  officerPhone: string;
  designation: string; // e.g. District Coordinator, State Secretary
  level?: string; // National, State, District, Block
  state?: string;
  district?: string;
  city?: string;
  address?: string;
  appointmentDate: string; // ISO date string
  issueDate: string;
  validUntil?: string;
  status: 'active' | 'revoked' | 'superseded';
  letterheadUrl?: string | null;
  customLetterheadUsed: boolean;
  smsNotification: SMSDeliveryStatus;
  issuedByName: string; // e.g. "Gulfam Siddique"
  issuedByDesignation: string; // "Founder & Chief Secretary"
  issuedByUid?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LetterheadSettings {
  letterheadUrl: string | null;
  uploadedAt?: string;
  fileName?: string;
  fileSize?: number;
  active: boolean;
  updatedAt?: string;
}
