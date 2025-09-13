import type { GoogleSheetsAppointment, Appointment, Patient, AppointmentSyncInfo } from '@/types';
import { GOOGLE_CONFIG, GOOGLE_SHEETS_URLS } from '@/constants/googleConfig';
import { Platform } from 'react-native';

const { GOOGLE_SHEET_ID, SHEET_NAME } = GOOGLE_CONFIG;

export class GoogleSheetsService {
  private static sanitizeSheetName(name: string): string {
    const safe = (name ?? '').trim();
    if (!safe || safe.length > 100) return 'Hoja1';
    return safe;
  }

  private static getCSVUrl(): string {
    const sheet = this.sanitizeSheetName(SHEET_NAME);
    return GOOGLE_SHEETS_URLS.getGvizCsvUrl(GOOGLE_SHEET_ID, sheet);
  }

  private static getPublicCSVUrl(): string {
    return this.getCSVUrl();
  }

  private static getGvizJsonUrl(): string {
    const sheet = this.sanitizeSheetName(SHEET_NAME);
    return GOOGLE_SHEETS_URLS.getGvizJsonUrl(GOOGLE_SHEET_ID, sheet);
  }

  private static withCors(url: string): string {
    const input = (url ?? '').toString();
    if (!input.trim() || input.length > 2048) return input;
    if (Platform.OS === 'web') {
      const proxy = 'https://cors.isomorphic-git.org/';
      if (input.startsWith('http://') || input.startsWith('https://')) {
        return proxy + input;
      }
      return proxy + 'https://' + input.replace(/^\/+/, '');
    }
    return input;
  }

  static async fetchAppointments(): Promise<{ appointments: Appointment[], patients: Patient[] }> {
    console.log('🔄 Starting Google Sheets fetch...');
    try {
      let data: any[][] | null = null;

      // Method 1: CSV via GViz (public, no auth)
      try {
        console.log('📡 Attempting GViz CSV (public)...');
        data = await this.fetchWithCSV();
        if (data && data.length > 0) {
          console.log('✅ GViz CSV successful');
        }
      } catch (csvError) {
        console.log('❌ GViz CSV failed:', (csvError as Error).message);
      }

      // Method 2: GViz JSON parse (public) fallback
      if (!data || data.length === 0) {
        try {
          console.log('📡 Attempting GViz JSON (public) fallback...');
          data = await this.fetchWithGvizJSON();
          if (data && data.length > 0) {
            console.log('✅ GViz JSON fallback successful');
          }
        } catch (jsonError) {
          console.log('❌ GViz JSON fallback failed:', (jsonError as Error).message);
        }
      }

      if (data && data.length > 0) {
        console.log('📊 Raw data from Google Sheets:', data.length, 'rows');
        console.log('📊 First row (headers):', data[0]);
        if (data.length > 1) {
          console.log('📊 Second row (sample data):', data[1]);
        }
        const appointments = this.parseGoogleSheetsData(data);
        const patients = this.extractPatientsFromAppointments(appointments);
        console.log(`✅ Successfully fetched ${appointments.length} appointments and ${patients.length} patients from Google Sheets`);
        if (appointments.length > 0) {
          console.log('📋 Sample appointments:');
          appointments.slice(0, 3).forEach((apt, i) => {
            console.log(`   ${i + 1}. ${apt.patientName} - ${apt.date} ${apt.time} (${apt.treatment})`);
          });
        }
        return { appointments, patients };
      }

      console.log('📋 No data from Google Sheets, using mock data with real dates');
      const mockAppointments = this.generateMockAppointments();
      const mockPatients = this.extractPatientsFromAppointments(mockAppointments);
      return { appointments: mockAppointments, patients: mockPatients };
    } catch (error) {
      console.error('❌ Google Sheets fetch error:', error);
      console.error('❌ Error details:', { message: (error as Error).message, stack: (error as Error).stack });
      const mockAppointments = this.generateMockAppointments();
      const mockPatients = this.extractPatientsFromAppointments(mockAppointments);
      return { appointments: mockAppointments, patients: mockPatients };
    }
  }

  private static async fetchWithGvizJSON(): Promise<any[][] | null> {
    const url = this.withCors(this.getGvizJsonUrl());
    console.log('🔄 Fetching GViz JSON from:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/plain,*/*',
      },
      redirect: 'follow',
      signal: controller.signal,
    } as RequestInit);
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`GViz JSON fetch failed: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const jsonStr = text.replace(/^.*setResponse\(/, '').replace(/\);\s*$/, '');
    const json = JSON.parse(jsonStr);
    const cols: string[] = json.table.cols.map((c: any) => c.label || c.id || '');
    const rows = json.table.rows as Array<{ c: Array<{ v: any } | null> }>;
    const values: any[][] = [];
    values.push(cols);
    rows.forEach((r) => {
      const row: any[] = [];
      r.c.forEach((cell, idx) => {
        row[idx] = (cell && cell.v != null) ? String(cell.v) : '';
      });
      if (row.some((v) => (v ?? '').toString().trim() !== '')) {
        values.push(row);
      }
    });
    console.log(`✅ Parsed ${values.length} rows from GViz JSON`);
    return values;
  }

  private static async fetchWithCSV(): Promise<any[][] | null> {
    const tryFetchCsv = async (url: string): Promise<any[][]> => {
      console.log('🔄 Fetching CSV from:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(this.withCors(url), {
        method: 'GET',
        headers: {
          Accept: 'text/csv,text/plain,*/*',
        },
        redirect: 'follow',
        signal: controller.signal,
        credentials: 'omit',
        mode: Platform.OS === 'web' ? 'cors' : undefined,
        referrerPolicy: Platform.OS === 'web' ? 'no-referrer' : undefined,
      } as RequestInit);
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`CSV fetch failed: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();
      console.log('📊 CSV response length:', csvText.length, 'characters');
      if (!csvText.trim()) {
        throw new Error('Empty CSV response');
      }
      const lines = csvText.split('\n').filter((line) => line.trim());
      const data = lines.map((line) => this.parseCSVLine(line));
      console.log(`✅ Parsed ${data.length} rows from CSV`);
      return data;
    };

    try {
      const csvUrlGViz = this.getPublicCSVUrl();
      try {
        return await tryFetchCsv(csvUrlGViz);
      } catch (e1) {
        console.warn('⚠️ GViz CSV failed, trying export CSV fallback...', (e1 as Error).message);
      }
      const exportUrl = GOOGLE_SHEETS_URLS.getExportCsvUrl(GOOGLE_CONFIG.GOOGLE_SHEET_ID, '0');
      return await tryFetchCsv(exportUrl);
    } catch (error) {
      console.error('❌ CSV fetch error:', error);
      throw error;
    }
  }

  private static parseGoogleSheetsData(values: any[][]): Appointment[] {
    if (values.length < 2) return [];
    const headers = values[0];
    const appointments: Appointment[] = [];
    console.log('📊 Headers found:', headers);
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length === 0) continue;
      try {
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });
        const appointment = this.convertToAppointment(rowData as any);
        if (appointment) {
          appointments.push(appointment);
        }
      } catch (error) {
        console.warn('Error parsing row:', row, error);
      }
    }
    console.log(`📋 Parsed ${appointments.length} appointments from Google Sheets`);
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
          i++;
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
      if (!row.Fecha || !row.Hora || !row.Nombre) {
        return null;
      }
      const dateParts = row.Fecha.split('/');
      let formattedDate = '';
      if (dateParts.length === 3) {
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        formattedDate = `${year}-${month}-${day}`;
      } else {
        const dateObj = new Date(row.Fecha);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        } else {
          formattedDate = row.Fecha;
        }
      }
      let formattedTime = row.Hora;
      if (row.Hora && !row.Hora.includes(':')) {
        const timeDecimal = parseFloat(row.Hora);
        if (!isNaN(timeDecimal)) {
          const hours = Math.floor(timeDecimal);
          const minutes = Math.round((timeDecimal - hours) * 60);
          formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      const patientId = row.NumPac || `patient_${row.Nombre.replace(/\s+/g, '_').toLowerCase()}`;
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
    return { isNew, isModified, needsUpdate };
  }

  static getStatusColor(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('planificad') || statusLower.includes('programad')) return '#3B82F6';
    if (statusLower.includes('finalizad') || statusLower.includes('completad')) return '#10B981';
    if (statusLower.includes('cancelad')) return '#EF4444';
    if (statusLower.includes('no') && statusLower.includes('asisti')) return '#F59E0B';
    return '#6B7280';
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
      if (!appointment.patientId?.trim() || appointment.patientId.length > 100) {
        return;
      }
      const patient = patientsMap.get(appointment.patientId)!;
      if (!appointment.id?.trim() || appointment.id.length > 100) {
        return;
      }
      const validatedAppointment = {
        ...appointment,
        id: appointment.id.trim(),
        patientName: appointment.patientName?.trim() || '',
        treatment: appointment.treatment?.trim() || 'Consulta general'
      };
      patient.appointments.push(validatedAppointment);
      const statusLower = appointment.status?.toLowerCase() || '';
      if (!appointment.date?.trim() || appointment.date.length > 20) {
        return;
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
    const appointments: Appointment[] = [];
    const specificDates = [
      { date: new Date(), label: 'Today' },
      { date: new Date(Date.now() + 86400000), label: 'Tomorrow' },
      { date: new Date(Date.now() + 2 * 86400000), label: 'Day after tomorrow' },
      { date: new Date(2025, 6, 7), label: 'July 7, 2025 (Monday)' },
      { date: new Date(2025, 6, 8), label: 'July 8, 2025 (Tuesday)' },
      { date: new Date(2025, 6, 9), label: 'July 9, 2025 (Wednesday)' },
    ];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateStr = date.toISOString().split('T')[0];
      const alreadyExists = specificDates.some(sd => sd.date.toISOString().split('T')[0] === dateStr);
      if (!alreadyExists) {
        specificDates.push({ date, label: `Day ${i}` });
      }
    }
    specificDates.forEach((dateInfo, dateIndex) => {
      const date = dateInfo.date;
      const dateStr = date.toISOString().split('T')[0];
      console.log(`📅 Generating appointments for ${dateInfo.label}: ${dateStr} (${date.toLocaleDateString('es-ES', { weekday: 'long' })})`);
      const appointmentsPerDay = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < appointmentsPerDay; j++) {
        const hour = 9 + j * 2;
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const patients = [
          { nombre: 'María', apellidos: 'González López', tel: '656123456' },
          { nombre: 'Carlos', apellidos: 'Ruiz Martín', tel: '677234567' },
          { nombre: 'Ana', apellidos: 'Martín García', tel: '688345678' },
          { nombre: 'Luis', apellidos: 'Fernández Pérez', tel: '699456789' },
          { nombre: 'Carmen', apellidos: 'Jiménez Ruiz', tel: '610567890' },
        ];
        const treatments = ['Revisión general','Limpieza dental','Empaste','Endodoncia','Implante dental','Ortodoncia','Extracción'];
        const statuses = ['Planificada', 'Finalizada', 'Cancelada', 'Desconocido'];
        const dentists = ['Dr. Mario Rubio', 'Dra. Irene García', 'Dra. Virginia Tresgallo'];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const treatment = treatments[Math.floor(Math.random() * treatments.length)];
        const status = dateIndex === 0 ? 'Planificada' : statuses[Math.floor(Math.random() * statuses.length)];
        const dentist = dentists[Math.floor(Math.random() * dentists.length)];
        const appointmentId = `mock_${dateIndex}_${j}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
          notes: Math.random() > 0.5 ? `Notas para ${patient.nombre} - ${dateInfo.label}` : undefined,
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
    });
    console.log(`📋 Generated ${appointments.length} mock appointments for ${specificDates.length} dates`);
    console.log('📋 Dates with appointments:', specificDates.map(d => `${d.date.toISOString().split('T')[0]} (${d.label})`));
    return appointments;
  }

  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing public Google Sheets (CSV) connection...');
      const url = this.withCors(this.getCSVUrl());
      console.log('🌐 Test URL:', url);
      const res = await fetch(url, {
        credentials: 'omit',
        mode: Platform.OS === 'web' ? 'cors' : undefined,
        referrerPolicy: Platform.OS === 'web' ? 'no-referrer' : undefined,
      } as RequestInit);
      console.log('📡 Test response status:', res.status, res.statusText);
      if (!res.ok) return false;
      const text = await res.text();
      return text.trim().length > 0;
    } catch (error) {
      console.error('❌ Google Sheets connection error:', error);
      return false;
    }
  }
}