export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit?: string;
  nextAppointment?: string;
  notes?: string;
  avatar?: string;
  appointments: Appointment[];
}

export interface Appointment {
  id: string;
  registro: string;
  patientId: string;
  patientName: string;
  apellidos: string;
  nombre: string;
  numPac?: string;
  date: string;
  time: string;
  treatment: string;
  status: 'Desconocido' | 'Planificada' | 'Finalizada' | 'Cancelada' | 'No asistió';
  notes?: string;
  duration?: number;
  dentist?: string;
  odontologo?: string;
  startDateTime?: string;
  endDateTime?: string;
  fechaAlta: string;
  citMod: string;
  telMovil?: string;
  estadoCita: string;
  situacion?: string;
}

export interface GoogleSheetsAppointment {
  Registro: string;
  CitMod: string;
  FechaAlta: string;
  NumPac: string;
  Apellidos: string;
  Nombre: string;
  TelMovil: string;
  Fecha: string;
  Hora: string;
  EstadoCita: string;
  Tratamiento: string;
  Odontologo: string;
  Notas: string;
  Duracion: string;
  FechaHoraIni: string;
  FechaHoraFin: string;
  Situacion?: string;
}

export interface AppointmentSyncInfo {
  isNew: boolean;
  isModified: boolean;
  needsUpdate: boolean;
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
  trigger: 'appointment_reminder' | 'post_treatment' | 'birthday' | 'manual';
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