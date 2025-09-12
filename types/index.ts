export interface Appointment {
  id: string;
  time: string;
  patient: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}