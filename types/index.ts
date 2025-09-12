export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  notes: string;
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
  category: string;
  variables: string[];
}

export interface Automation {
  id: string;
  name: string;
  trigger: 'consultation_reminder' | 'post_treatment' | string;
  templateId: string;
  timing: string;
  isActive: boolean;
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