import type { Appointment, Patient } from '@/types';

// SQL Server appointment data structure
export interface SQLServerAppointment {
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
}

export interface SQLServerConfig {
  server: string;
  database: string;
  apiEndpoint?: string; // For web-based SQL proxy
}

export class SQLServerService {
  private static config: SQLServerConfig = {
    server: 'GABINETE2\\INFOMED', // Your SQL Server instance
    database: 'GELITE', // Your database name
    apiEndpoint: '/api/sql-proxy' // Web proxy endpoint
  };

  private static lastSyncData: Map<string, SQLServerAppointment> = new Map();
  private static isInitialized = false;

  static configure(config: Partial<SQLServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static async fetchAppointments(): Promise<{ appointments: Appointment[], patients: Patient[], newAppointments: Appointment[], updatedAppointments: Appointment[] }> {
    try {
      console.log('Fetching appointments from SQL Server...');
      
      // For web compatibility, we'll use a REST API endpoint
      // In a real implementation, you'd have a backend service
      const sqlData = await this.executeSQLQuery();
      
      const { newAppointments, updatedAppointments, allAppointments } = this.processAppointmentChanges(sqlData);
      const appointments = this.convertToAppointments(allAppointments);
      const patients = this.extractPatientsFromAppointments(appointments);
      
      console.log(`Processed ${appointments.length} appointments (${newAppointments.length} new, ${updatedAppointments.length} updated)`);
      
      return {
        appointments,
        patients,
        newAppointments: this.convertToAppointments(newAppointments),
        updatedAppointments: this.convertToAppointments(updatedAppointments)
      };
    } catch (error) {
      console.error('Error fetching SQL Server data:', error);
      throw error;
    }
  }

  private static async executeSQLQuery(): Promise<SQLServerAppointment[]> {
    try {
      console.log('🔄 Conectando con API backend robusto...');
      console.log('📊 Servidor: GABINETE2\\INFOMED');
      console.log('🗄️ Base de datos: GELITE');
      
      // Opción 1: Intentar conectar con el backend API robusto
      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout más largo para consultas SQL complejas
        signal: AbortSignal.timeout(30000)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // El nuevo backend devuelve un objeto con metadata
        if (responseData.appointments) {
          const sqlData: SQLServerAppointment[] = responseData.appointments;
          const metadata = responseData.metadata || {};
          
          console.log(`✅ Datos obtenidos del backend robusto:`);
          console.log(`   📋 Total: ${sqlData.length} registros`);
          console.log(`   🆕 Nuevos: ${metadata.new_count || 0}`);
          console.log(`   🔄 Actualizados: ${metadata.updated_count || 0}`);
          console.log(`   ⏰ Timestamp: ${metadata.timestamp || 'N/A'}`);
          
          return sqlData;
        } else {
          // Compatibilidad con respuesta simple
          const sqlData: SQLServerAppointment[] = Array.isArray(responseData) ? responseData : [];
          console.log(`✅ Datos obtenidos del backend: ${sqlData.length} registros`);
          return sqlData;
        }
      }
      
      throw new Error(`Backend API no disponible: ${response.status} - ${response.statusText}`);
      
    } catch (backendError) {
      console.warn('⚠️ Backend API no disponible, intentando archivo local...', backendError);
      
      try {
        // Opción 2: Intentar leer archivo JSON generado por el script Python robusto
        const fileResponse = await fetch('/appointments_data.json');
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          const sqlData: SQLServerAppointment[] = fileData.appointments || [];
          const syncInfo = fileData.sync_info || {};
          
          console.log(`✅ Datos obtenidos del archivo local:`);
          console.log(`   📋 Total: ${sqlData.length} registros`);
          console.log(`   ⏰ Timestamp: ${fileData.timestamp || 'N/A'}`);
          console.log(`   🖥️ Servidor: ${syncInfo.server || 'N/A'}`);
          console.log(`   📊 Script: ${syncInfo.script_version || 'N/A'}`);
          
          return sqlData;
        }
        
        throw new Error('Archivo local no disponible');
        
      } catch (fileError) {
        console.warn('⚠️ Archivo local no disponible, usando datos simulados mejorados...', fileError);
        
        // Fallback a datos simulados más realistas
        const mockSQLData: SQLServerAppointment[] = [
          {
            Registro: '1001',
            CitMod: '2025-01-11 10:30:00',
            FechaAlta: '2025-01-11 10:30:00',
            NumPac: 'P001',
            Apellidos: 'García López',
            Nombre: 'María',
            TelMovil: '+34 666 123 456',
            Fecha: '2025-01-15',
            Hora: '09:00',
            EstadoCita: 'Planificada',
            Tratamiento: 'Revision',
            Odontologo: 'Dr. Mario Rubio',
            Notas: 'Primera visita del año - Revisión general'
          },
          {
            Registro: '1002',
            CitMod: '2025-01-11 11:00:00',
            FechaAlta: '2025-01-10 15:30:00',
            NumPac: 'P002',
            Apellidos: 'Ruiz Martín',
            Nombre: 'Carlos',
            TelMovil: '+34 677 234 567',
            Fecha: '2025-01-16',
            Hora: '10:30',
            EstadoCita: 'Confirmada',
            Tratamiento: 'Ortodoncia',
            Odontologo: 'Dra. Irene Garcia',
            Notas: 'Ajuste de brackets - Control mensual'
          },
          {
            Registro: '1003',
            CitMod: '2025-01-11 12:00:00',
            FechaAlta: '2025-01-11 12:00:00',
            NumPac: 'P003',
            Apellidos: 'Martín Sánchez',
            Nombre: 'Ana',
            TelMovil: '+34 688 345 678',
            Fecha: '2025-01-17',
            Hora: '11:00',
            EstadoCita: 'Planificada',
            Tratamiento: 'Higiene dental',
            Odontologo: 'Dra. Virginia Tresgallo',
            Notas: 'Limpieza y revisión - Cita semestral'
          },
          {
            Registro: '1004',
            CitMod: '2025-01-11 14:00:00',
            FechaAlta: '2025-01-11 14:00:00',
            NumPac: 'P004',
            Apellidos: 'López Fernández',
            Nombre: 'Juan',
            TelMovil: '+34 699 456 789',
            Fecha: '2025-01-18',
            Hora: '16:00',
            EstadoCita: 'Planificada',
            Tratamiento: 'Cirugia Implantes',
            Odontologo: 'Dr. Juan Antonio Manzanedo',
            Notas: 'Colocación de implante molar inferior'
          },
          {
            Registro: '1005',
            CitMod: '2025-01-11 15:30:00',
            FechaAlta: '2025-01-09 09:15:00',
            NumPac: 'P005',
            Apellidos: 'Rodríguez Pérez',
            Nombre: 'Elena',
            TelMovil: '+34 611 789 123',
            Fecha: '2025-01-19',
            Hora: '12:30',
            EstadoCita: 'Confirmada',
            Tratamiento: 'Periodoncia',
            Odontologo: 'Dra. Miriam Carrasco',
            Notas: 'Tratamiento periodontal - Segunda sesión'
          }
        ];
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`📋 Usando datos simulados mejorados: ${mockSQLData.length} registros`);
        console.log('💡 Para usar datos reales, inicie el backend con: node backend-server.js');
        console.log('💡 O ejecute el script Python: python sql_sync_robust.py');
        
        return mockSQLData;
      }
    }
  }

  private static processAppointmentChanges(sqlData: SQLServerAppointment[]): {
    newAppointments: SQLServerAppointment[];
    updatedAppointments: SQLServerAppointment[];
    allAppointments: SQLServerAppointment[];
  } {
    const newAppointments: SQLServerAppointment[] = [];
    const updatedAppointments: SQLServerAppointment[] = [];
    
    sqlData.forEach(appointment => {
      const existingAppointment = this.lastSyncData.get(appointment.Registro);
      
      // Check if it's a new appointment (FechaAlta === CitMod)
      if (appointment.FechaAlta === appointment.CitMod) {
        if (!existingAppointment) {
          newAppointments.push(appointment);
          console.log(`New appointment detected: ${appointment.Registro}`);
        }
      } else {
        // It's an updated appointment (FechaAlta !== CitMod)
        if (existingAppointment) {
          // Check if there are actual changes
          if (this.hasAppointmentChanged(existingAppointment, appointment)) {
            updatedAppointments.push(appointment);
            console.log(`Updated appointment detected: ${appointment.Registro}`);
          }
        } else {
          // Treat as new if we don't have it in our cache
          newAppointments.push(appointment);
        }
      }
      
      // Update our cache
      this.lastSyncData.set(appointment.Registro, { ...appointment });
    });
    
    this.isInitialized = true;
    
    return {
      newAppointments,
      updatedAppointments,
      allAppointments: sqlData
    };
  }

  private static hasAppointmentChanged(existing: SQLServerAppointment, current: SQLServerAppointment): boolean {
    // Compare key fields to detect changes
    const fieldsToCompare: (keyof SQLServerAppointment)[] = [
      'Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 'Odontologo', 'Notas', 'TelMovil'
    ];
    
    return fieldsToCompare.some(field => existing[field] !== current[field]);
  }

  private static convertToAppointments(sqlData: SQLServerAppointment[]): Appointment[] {
    return sqlData.map(row => this.convertSQLToAppointment(row)).filter(Boolean) as Appointment[];
  }

  private static convertSQLToAppointment(row: SQLServerAppointment): Appointment | null {
    try {
      if (!row.Fecha || !row.Hora || !row.Nombre) {
        return null;
      }

      // Parse date (assuming YYYY-MM-DD format from SQL)
      let formattedDate = row.Fecha;
      if (row.Fecha.includes('/')) {
        const dateParts = row.Fecha.split('/');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          formattedDate = `${year}-${month}-${day}`;
        }
      }

      // Parse time (assuming HH:MM format)
      let formattedTime = row.Hora;
      if (row.Hora && !row.Hora.includes(':')) {
        const timeDecimal = parseFloat(row.Hora);
        if (!isNaN(timeDecimal)) {
          const hours = Math.floor(timeDecimal);
          const minutes = Math.round((timeDecimal - hours) * 60);
          formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }

      // Map status from SQL to our format
      const status = this.mapSQLStatus(row.EstadoCita);

      // Generate patient ID from patient number
      const patientId = row.NumPac || `patient_${row.Nombre.replace(/\s+/g, '_').toLowerCase()}`;

      return {
        id: row.Registro,
        patientId,
        patientName: `${row.Nombre} ${row.Apellidos}`.trim(),
        date: formattedDate,
        time: formattedTime,
        treatment: row.Tratamiento || 'Consulta general',
        status,
        notes: row.Notas,
        dentist: row.Odontologo,
        startDateTime: `${formattedDate}T${formattedTime}:00`,
        endDateTime: undefined // Calculate based on treatment duration if needed
      };
    } catch (error) {
      console.warn('Error converting SQL row to appointment:', error);
      return null;
    }
  }

  private static mapSQLStatus(estadoCita: string): 'scheduled' | 'completed' | 'cancelled' | 'no-show' {
    const status = estadoCita?.toLowerCase() || '';
    
    if (status.includes('planificada') || status.includes('confirmada')) {
      return 'scheduled';
    }
    if (status.includes('finalizada') || status.includes('completada')) {
      return 'completed';
    }
    if (status.includes('anulada') || status.includes('cancelada')) {
      return 'cancelled';
    }
    
    return 'scheduled'; // Default
  }

  private static extractPatientsFromAppointments(appointments: Appointment[]): Patient[] {
    const patientsMap = new Map<string, Patient>();

    appointments.forEach(appointment => {
      if (!patientsMap.has(appointment.patientId)) {
        // Find phone number from SQL data
        const sqlAppointment = Array.from(this.lastSyncData.values())
          .find(sql => sql.Registro === appointment.id);
        
        patientsMap.set(appointment.patientId, {
          id: appointment.patientId,
          name: appointment.patientName,
          phone: sqlAppointment?.TelMovil || '+34 000 000 000',
          appointments: [],
          lastVisit: appointment.status === 'completed' ? appointment.date : undefined,
          nextAppointment: appointment.status === 'scheduled' ? appointment.date : undefined,
        });
      }

      const patient = patientsMap.get(appointment.patientId)!;
      patient.appointments.push(appointment);

      // Update last visit and next appointment
      if (appointment.status === 'completed') {
        if (!patient.lastVisit || appointment.date > patient.lastVisit) {
          patient.lastVisit = appointment.date;
        }
      }
      if (appointment.status === 'scheduled') {
        if (!patient.nextAppointment || appointment.date < patient.nextAppointment) {
          patient.nextAppointment = appointment.date;
        }
      }
    });

    return Array.from(patientsMap.values());
  }

  static async testConnection(): Promise<boolean> {
    try {
      // Test backend API connection with timeout
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Backend API conectado correctamente');
        console.log(`   📊 Estado: ${healthData.status}`);
        console.log(`   🖥️ Servidor: ${healthData.server}`);
        console.log(`   🗄️ Base de datos: ${healthData.database}`);
        console.log(`   📋 Citas en caché: ${healthData.cached_appointments || 0}`);
        return true;
      } else {
        console.warn(`⚠️ Backend API respondió con error: ${response.status} - ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar con el backend API:', error);
      return false;
    }
  }

  // Method to get sync statistics from backend
  static async getSyncStats(): Promise<{ 
    totalAppointments: number; 
    lastSync: Date | null;
    newAppointmentsCount: number;
    updatedAppointmentsCount: number;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    serverInfo?: {
      server: string;
      database: string;
      backendAvailable: boolean;
    };
  }> {
    try {
      // Try to get stats from backend
      const response = await fetch('http://localhost:3001/api/sync-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const backendStats = await response.json();
        return {
          totalAppointments: backendStats.total_appointments || 0,
          lastSync: backendStats.last_sync ? new Date(backendStats.last_sync) : null,
          newAppointmentsCount: backendStats.new_appointments || 0,
          updatedAppointmentsCount: backendStats.updated_appointments || 0,
          connectionStatus: backendStats.connection_status === 'connected' ? 'connected' : 'disconnected',
          serverInfo: {
            server: backendStats.server || 'N/A',
            database: backendStats.database || 'N/A',
            backendAvailable: true
          }
        };
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener estadísticas del backend:', error);
    }
    
    // Fallback to local stats
    return {
      totalAppointments: this.lastSyncData.size,
      lastSync: this.isInitialized ? new Date() : null,
      newAppointmentsCount: Array.from(this.lastSyncData.values()).filter(apt => apt.FechaAlta === apt.CitMod).length,
      updatedAppointmentsCount: Array.from(this.lastSyncData.values()).filter(apt => apt.FechaAlta !== apt.CitMod).length,
      connectionStatus: this.isInitialized ? 'connected' : 'disconnected',
      serverInfo: {
        server: this.config.server,
        database: this.config.database,
        backendAvailable: false
      }
    };
  }

  // Method to clear cache (useful for testing)
  static clearCache(): void {
    this.lastSyncData.clear();
    this.isInitialized = false;
  }

  // Method to update appointment status via backend API
  static async updateAppointmentStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando estado de cita ${appointmentId} a ${status}...`);
      
      const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Estado actualizado: ${result.message}`);
        return true;
      } else {
        const error = await response.json();
        console.error(`❌ Error actualizando estado: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error conectando con backend para actualizar estado:', error);
      return false;
    }
  }

  // Method to get backend setup instructions
  static getSetupInstructions(): {
    backend: string[];
    python: string[];
    scheduler: string[];
  } {
    return {
      backend: [
        '1. Instalar Node.js desde https://nodejs.org',
        '2. Instalar dependencias: npm install express mssql cors',
        '3. Ejecutar backend: node backend-server.js',
        '4. Verificar en http://localhost:3001/api/health'
      ],
      python: [
        '1. Instalar Python desde https://python.org',
        '2. Instalar pyodbc: pip install pyodbc requests',
        '3. Ejecutar script: python sql_sync_robust.py',
        '4. Verificar archivo: appointments_data.json'
      ],
      scheduler: [
        '1. Abrir Programador de Tareas (taskschd.msc)',
        '2. Crear tarea básica: "Sync Citas SQL"',
        '3. Desencadenador: Repetir cada 5 minutos',
        '4. Acción: python "C:\\Users\\Clinica\\...\\sql_sync_robust.py"',
        '5. Configurar directorio de inicio correctamente'
      ]
    };
  }

  // Method to verify sync functionality with enhanced diagnostics
  static async verifySyncStatus(): Promise<{
    isWorking: boolean;
    message: string;
    details: {
      totalAppointments: number;
      newAppointments: number;
      updatedAppointments: number;
      lastSync: string | null;
      connectionStatus: string;
      backendAvailable: boolean;
      serverInfo: string;
    };
  }> {
    try {
      console.log('🔍 Verificando estado de sincronización robusto...');
      
      // Test connection
      const canConnect = await this.testConnection();
      const stats = await this.getSyncStats();
      
      if (!canConnect) {
        return {
          isWorking: false,
          message: '❌ Backend API no disponible. Usando modo simulado.',
          details: {
            totalAppointments: stats.totalAppointments,
            newAppointments: stats.newAppointmentsCount,
            updatedAppointments: stats.updatedAppointmentsCount,
            lastSync: stats.lastSync?.toLocaleString('es-ES') || null,
            connectionStatus: 'disconnected',
            backendAvailable: false,
            serverInfo: `${stats.serverInfo?.server}/${stats.serverInfo?.database} (Sin conexión)`
          }
        };
      }
      
      // Fetch fresh data
      const data = await this.fetchAppointments();
      
      return {
        isWorking: true,
        message: `✅ Sincronización funcionando correctamente. ${data.appointments.length} citas sincronizadas desde ${stats.serverInfo?.server}.`,
        details: {
          totalAppointments: data.appointments.length,
          newAppointments: data.newAppointments.length,
          updatedAppointments: data.updatedAppointments.length,
          lastSync: stats.lastSync?.toLocaleString('es-ES') || null,
          connectionStatus: stats.connectionStatus,
          backendAvailable: stats.serverInfo?.backendAvailable || false,
          serverInfo: `${stats.serverInfo?.server}/${stats.serverInfo?.database}`
        }
      };
    } catch (error) {
      console.error('❌ Error verificando sincronización:', error);
      const stats = await this.getSyncStats();
      
      return {
        isWorking: false,
        message: `❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        details: {
          totalAppointments: stats.totalAppointments,
          newAppointments: stats.newAppointmentsCount,
          updatedAppointments: stats.updatedAppointmentsCount,
          lastSync: stats.lastSync?.toLocaleString('es-ES') || null,
          connectionStatus: 'error',
          backendAvailable: false,
          serverInfo: 'Error de conexión'
        }
      };
    }
  }
}