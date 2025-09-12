import type { GoogleSheetsAppointment, Appointment, Patient, AppointmentSyncInfo } from '@/types';

const GOOGLE_SHEETS_ID = '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ';
const SHEET_NAME = 'Hoja 1';

export class GoogleSheetsService {
  private static getCSVUrl(): string {
    return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  }

  static async fetchAppointments(): Promise<{ appointments: Appointment[], patients: Patient[] }> {
    try {
      console.log('Fetching appointments from Google Sheets...');
      const response = await fetch(this.getCSVUrl());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const appointments = this.parseCSVToAppointments(csvText);
      const patients = this.extractPatientsFromAppointments(appointments);
      
      console.log(`Fetched ${appointments.length} appointments and ${patients.length} patients`);
      return { appointments, patients };
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }

  private static parseCSVToAppointments(csvText: string): Appointment[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Remove quotes and split headers
    const headers = lines[0].replace(/"/g, '').split(',');
    const appointments: Appointment[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line handling quoted values
        const values = this.parseCSVLine(line);
        if (values.length !== headers.length) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        const appointment = this.convertToAppointment(rowData as any);
        if (appointment) {
          appointments.push(appointment);
        }
      } catch (error) {
        console.warn('Error parsing CSV line:', line, error);
      }
    }

    return appointments;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private static convertToAppointment(row: GoogleSheetsAppointment): Appointment | null {
    try {
      // Skip empty rows
      if (!row.Fecha || !row.Hora || !row.Nombre) {
        return null;
      }

      // Parse date (assuming DD/MM/YYYY format)
      const dateParts = row.Fecha.split('/');
      let formattedDate = '';
      if (dateParts.length === 3) {
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        formattedDate = `${year}-${month}-${day}`;
      } else {
        // Try ISO format or other formats
        const dateObj = new Date(row.Fecha);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        } else {
          formattedDate = row.Fecha;
        }
      }

      // Parse time (assuming HH:MM format)
      let formattedTime = row.Hora;
      if (row.Hora && !row.Hora.includes(':')) {
        // If time is in decimal format (e.g., 9.5 for 9:30)
        const timeDecimal = parseFloat(row.Hora);
        if (!isNaN(timeDecimal)) {
          const hours = Math.floor(timeDecimal);
          const minutes = Math.round((timeDecimal - hours) * 60);
          formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }

      // Generate patient ID from patient number or name
      const patientId = row.NumPac || `patient_${row.Nombre.replace(/\s+/g, '_').toLowerCase()}`;

      // Store phone number for later use
      if (row.TelMovil) {
        this.storePhoneNumber(patientId, row.TelMovil);
      }

      return {
        id: row.Registro || `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        registro: row.Registro,
        patientId,
        patientName: `${row.Nombre} ${row.Apellidos}`.trim(),
        apellidos: row.Apellidos,
        nombre: row.Nombre,
        numPac: row.NumPac,
        date: formattedDate,
        time: formattedTime,
        treatment: row.Tratamiento || 'Consulta general',
        status: row.EstadoCita as any || 'Desconocido',
        notes: row.Notas,
        duration: row.Duracion ? parseInt(row.Duracion) : undefined,
        dentist: row.Odontologo,
        odontologo: row.Odontologo,
        startDateTime: row.FechaHoraIni,
        endDateTime: row.FechaHoraFin,
        fechaAlta: row.FechaAlta,
        citMod: row.CitMod,
        telMovil: row.TelMovil,
        estadoCita: row.EstadoCita,
        situacion: row.Situacion || row.EstadoCita,
      };
    } catch (error) {
      console.warn('Error converting row to appointment:', error);
      return null;
    }
  }

  static getSyncInfo(appointment: Appointment): AppointmentSyncInfo {
    const fechaAlta = new Date(appointment.fechaAlta);
    const citMod = new Date(appointment.citMod);
    
    const isNew = fechaAlta.getTime() === citMod.getTime();
    const isModified = !isNew;
    const needsUpdate = isModified;
    
    return {
      isNew,
      isModified,
      needsUpdate
    };
  }

  static getStatusColor(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('planificad') || statusLower.includes('programad')) {
      return '#3B82F6'; // Blue
    }
    if (statusLower.includes('finalizad') || statusLower.includes('completad')) {
      return '#10B981'; // Green
    }
    if (statusLower.includes('cancelad')) {
      return '#EF4444'; // Red
    }
    if (statusLower.includes('no') && statusLower.includes('asisti')) {
      return '#F59E0B'; // Orange
    }
    
    return '#6B7280'; // Gray for unknown
  }

  private static extractPatientsFromAppointments(appointments: Appointment[]): Patient[] {
    const patientsMap = new Map<string, Patient>();
    const phoneMap = new Map<string, string>(); // Store phone numbers by patient ID

    // First pass: collect phone numbers from raw data if available
    // This would be enhanced if we had access to the raw row data with TelMovil

    appointments.forEach(appointment => {
      if (!patientsMap.has(appointment.patientId)) {
        patientsMap.set(appointment.patientId, {
          id: appointment.patientId,
          name: appointment.patientName,
          phone: appointment.telMovil || this.getPhoneNumber(appointment.patientId),
          appointments: [],
          lastVisit: appointment.status?.toLowerCase().includes('finalizad') ? appointment.date : undefined,
          nextAppointment: appointment.status?.toLowerCase().includes('planificad') ? appointment.date : undefined,
        });
      }

      // Add appointment to patient
      const patient = patientsMap.get(appointment.patientId)!;
      patient.appointments.push(appointment);

      // Update last visit and next appointment based on Spanish status
      const statusLower = appointment.status?.toLowerCase() || '';
      if (statusLower.includes('finalizad') || statusLower.includes('completad')) {
        if (!patient.lastVisit || appointment.date > patient.lastVisit) {
          patient.lastVisit = appointment.date;
        }
      }
      if (statusLower.includes('planificad') || statusLower.includes('programad')) {
        if (!patient.nextAppointment || appointment.date < patient.nextAppointment) {
          patient.nextAppointment = appointment.date;
        }
      }
    });

    return Array.from(patientsMap.values());
  }

  // Enhanced method to store phone numbers during parsing
  private static phoneNumbers = new Map<string, string>();
  
  static storePhoneNumber(patientId: string, phone: string): void {
    if (phone && phone.trim()) {
      this.phoneNumbers.set(patientId, phone.trim());
    }
  }
  
  static getPhoneNumber(patientId: string): string {
    return this.phoneNumbers.get(patientId) || '+34 000 000 000';
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.getCSVUrl());
      return response.ok;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}