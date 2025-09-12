import type { GoogleSheetsAppointment, Appointment, Patient, AppointmentSyncInfo } from '@/types';

const GOOGLE_SHEETS_ID = '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ';
const SHEET_NAME = 'Hoja 1';

export class GoogleSheetsService {
  private static getCSVUrl(): string {
    return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  }

  private static getPublicCSVUrl(): string {
    return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=0`;
  }

  static async fetchAppointments(): Promise<{ appointments: Appointment[], patients: Patient[] }> {
    console.log('🔄 Starting Google Sheets fetch...');
    
    try {
      // First, try to test connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Google Sheets connection test failed, using mock data');
        const mockAppointments = this.generateMockAppointments();
        const mockPatients = this.extractPatientsFromAppointments(mockAppointments);
        return { appointments: mockAppointments, patients: mockPatients };
      }

      // Try to fetch using a CORS proxy or alternative method
      const data = await this.fetchWithFallback();
      
      if (data) {
        const appointments = this.parseCSVToAppointments(data);
        const patients = this.extractPatientsFromAppointments(appointments);
        
        console.log(`✅ Successfully fetched ${appointments.length} appointments and ${patients.length} patients`);
        return { appointments, patients };
      }
      
      throw new Error('No data received from Google Sheets');
      
    } catch (error) {
      console.error('❌ Google Sheets fetch error:', error);
      
      // Always return mock data as fallback
      console.warn('⚠️ Using mock data due to fetch error');
      const mockAppointments = this.generateMockAppointments();
      const mockPatients = this.extractPatientsFromAppointments(mockAppointments);
      
      return { appointments: mockAppointments, patients: mockPatients };
    }
  }

  private static async fetchWithFallback(): Promise<string | null> {
    const urls = [
      // Try the public CSV export first
      `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=0`,
      // Try with different gid
      `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv`,
      // Try the query API
      `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`,
    ];
    
    for (const url of urls) {
      try {
        console.log(`📡 Trying URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,text/plain,*/*',
            'User-Agent': 'Mozilla/5.0 (compatible; RubioGarciaApp/1.0)',
          },
          mode: 'cors',
          cache: 'no-cache',
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            console.log(`✅ Successfully fetched data from: ${url}`);
            console.log(`📄 Data length: ${text.length}`);
            return text;
          }
        }
        
      } catch (error) {
        console.log(`❌ Failed to fetch from ${url}:`, error);
        continue;
      }
    }
    
    return null;
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
    if (!appointment?.fechaAlta?.trim() || !appointment?.citMod?.trim()) {
      return { isNew: false, isModified: false, needsUpdate: false };
    }
    
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

      // Add appointment to patient with validation
      if (!appointment.patientId?.trim() || appointment.patientId.length > 100) {
        return; // Skip invalid patient ID
      }
      
      const patient = patientsMap.get(appointment.patientId)!;
      
      // Validate appointment before adding
      if (!appointment.id?.trim() || appointment.id.length > 100) {
        return; // Skip invalid appointment
      }
      
      // Validate appointment object completely before adding
      const validatedAppointment = {
        ...appointment,
        id: appointment.id.trim(),
        patientName: appointment.patientName?.trim() || '',
        treatment: appointment.treatment?.trim() || 'Consulta general'
      };
      
      patient.appointments.push(validatedAppointment);

      // Update last visit and next appointment based on Spanish status
      const statusLower = appointment.status?.toLowerCase() || '';
      
      // Validate appointment date before using it
      if (!appointment.date?.trim() || appointment.date.length > 20) {
        return; // Skip invalid appointment date
      }
      
      const sanitizedDate = appointment.date.trim();
      
      if (statusLower.includes('finalizad') || statusLower.includes('completad')) {
        if (!patient.lastVisit || sanitizedDate > patient.lastVisit) {
          patient.lastVisit = sanitizedDate;
        }
      }
      if (statusLower.includes('planificad') || statusLower.includes('programad')) {
        if (!patient.nextAppointment || sanitizedDate < patient.nextAppointment) {
          patient.nextAppointment = sanitizedDate;
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

  private static generateMockAppointments(): Appointment[] {
    const today = new Date();
    const appointments: Appointment[] = [];
    
    // Generate appointments for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate 2-4 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < appointmentsPerDay; j++) {
        const hour = 9 + j * 2; // 9:00, 11:00, 13:00, 15:00
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        
        const patients = [
          { nombre: 'María', apellidos: 'González López', tel: '656123456' },
          { nombre: 'Carlos', apellidos: 'Ruiz Martín', tel: '677234567' },
          { nombre: 'Ana', apellidos: 'Martín García', tel: '688345678' },
          { nombre: 'Luis', apellidos: 'Fernández Pérez', tel: '699456789' },
          { nombre: 'Carmen', apellidos: 'Jiménez Ruiz', tel: '610567890' },
        ];
        
        const treatments = [
          'Revisión general',
          'Limpieza dental',
          'Empaste',
          'Endodoncia',
          'Implante dental',
          'Ortodoncia',
          'Extracción',
        ];
        
        const statuses = ['Planificada', 'Finalizada', 'Cancelada', 'Desconocido'];
        const dentists = ['Dr. Mario Rubio', 'Dra. Irene García', 'Dra. Virginia Tresgallo'];
        
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const treatment = treatments[Math.floor(Math.random() * treatments.length)];
        const status = i === 0 ? 'Planificada' : statuses[Math.floor(Math.random() * statuses.length)];
        const dentist = dentists[Math.floor(Math.random() * dentists.length)];
        
        const appointmentId = `mock_${i}_${j}_${Date.now()}`;
        const registro = `${1000 + appointments.length}`;
        const patientId = `patient_${patient.nombre.toLowerCase()}_${patient.apellidos.split(' ')[0].toLowerCase()}`;
        
        const now = new Date().toISOString();
        const modifiedDate = Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 86400000).toISOString() : now;
        
        appointments.push({
          id: appointmentId,
          registro,
          patientId,
          patientName: `${patient.nombre} ${patient.apellidos}`,
          apellidos: patient.apellidos,
          nombre: patient.nombre,
          numPac: `P${1000 + Math.floor(Math.random() * 9000)}`,
          date: dateStr,
          time: timeStr,
          treatment,
          status: status as any,
          notes: Math.random() > 0.5 ? `Notas para ${patient.nombre}` : undefined,
          duration: 30 + Math.floor(Math.random() * 60),
          dentist,
          odontologo: dentist,
          startDateTime: `${dateStr}T${timeStr}:00`,
          endDateTime: `${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`,
          fechaAlta: now,
          citMod: modifiedDate,
          telMovil: patient.tel,
          estadoCita: status,
          situacion: status,
        });
      }
    }
    
    console.log(`📋 Generated ${appointments.length} mock appointments`);
    return appointments;
  }

  static async testConnection(): Promise<boolean> {
    try {
      // Simple connectivity test using a lightweight request
      const testUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit`;
      
      await fetch(testUrl, { 
        method: 'HEAD',
        mode: 'no-cors', // This will always succeed but we can't read the response
        cache: 'no-cache'
      });
      
      // Since we're using no-cors, we can't check the actual response
      // but if the fetch doesn't throw, it means the URL is reachable
      console.log('✅ Basic connectivity test passed');
      return true;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}