export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit?: string;
  notes?: string;
  avatar?: string;
}

export interface WhatsAppMessage {
  id: string;
  patientId: string;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  isRead: boolean;
  messageType: 'text' | 'image' | 'document';
}

export interface WhatsAppConversation {
  id: string;
  patient: Patient;
  lastMessage: WhatsAppMessage;
  unreadCount: number;
  isActive: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'reminder' | 'confirmation' | 'consent' | 'general';
  variables: string[];
}

export interface Automation {
  id: string;
  name: string;
  trigger: 'consultation_reminder' | 'post_treatment' | 'birthday' | 'manual';
  templateId: string;
  timing: string;
  isActive: boolean;
  conditions?: any;
}

export interface AIConfig {
  isEnabled: boolean;
  personality: string;
  knowledgeBase: string[];
  autoReplyEnabled: boolean;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
}