const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// SQL Server configuration
const config = {
  server: 'GABINETE2\\INFOMED',
  database: 'GELITE',
  authentication: {
    type: 'ntlm',
    options: {
      domain: 'GABINETE2',
      userName: 'Clinica',
      password: '6666'
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
    instanceName: 'INFOMED'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Global variables
let pool;
let lastSyncData = new Map();
let isConnected = false;

// Logging function
function logMessage(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Connect to SQL Server with retry logic
async function connectToSQL() {
  let retries = 3;
  while (retries > 0) {
    try {
      logMessage(`Intentando conectar a SQL Server: ${config.server}/${config.database}`);
      pool = await sql.connect(config);
      isConnected = true;
      logMessage('✅ Conectado a SQL Server exitosamente');
      return;
    } catch (err) {
      retries--;
      logMessage(`❌ Error conectando a SQL Server (intentos restantes: ${retries}): ${err.message}`);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
  }
  logMessage('❌ No se pudo establecer conexión con SQL Server después de varios intentos');
}

// Process appointments to detect new and updated ones
function processAppointmentChanges(currentData) {
  const newAppointments = [];
  const updatedAppointments = [];
  
  currentData.forEach(appointment => {
    const existingAppointment = lastSyncData.get(appointment.Registro);
    
    // Check if it's a new appointment (FechaAlta === CitMod)
    if (appointment.FechaAlta === appointment.CitMod) {
      if (!existingAppointment) {
        newAppointments.push(appointment);
        logMessage(`Nueva cita detectada: ${appointment.Registro} - ${appointment.Nombre} ${appointment.Apellidos}`);
      }
    } else {
      // It's an updated appointment (FechaAlta !== CitMod)
      if (existingAppointment) {
        // Check if there are actual changes
        if (hasAppointmentChanged(existingAppointment, appointment)) {
          updatedAppointments.push(appointment);
          logMessage(`Cita actualizada detectada: ${appointment.Registro} - ${appointment.Nombre} ${appointment.Apellidos}`);
        }
      } else {
        // Treat as new if we don't have it in our cache
        newAppointments.push(appointment);
      }
    }
    
    // Update our cache
    lastSyncData.set(appointment.Registro, { ...appointment });
  });
  
  return { newAppointments, updatedAppointments };
}

// Check if appointment has changed
function hasAppointmentChanged(existing, current) {
  const fieldsToCompare = ['Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 'Odontologo', 'Notas', 'TelMovil'];
  return fieldsToCompare.some(field => existing[field] !== current[field]);
}

// Save data to JSON file for fallback
function saveDataToFile(data, filename = 'appointments_data.json') {
  try {
    const outputData = {
      timestamp: new Date().toISOString(),
      appointments: data,
      total_count: data.length,
      server_info: {
        server: config.server,
        database: config.database,
        connected: isConnected
      }
    };
    
    fs.writeFileSync(filename, JSON.stringify(outputData, null, 2), 'utf8');
    logMessage(`Datos guardados en ${filename}`);
  } catch (error) {
    logMessage(`Error guardando datos en archivo: ${error.message}`);
  }
}

// API endpoint to get appointments
app.get('/api/appointments', async (req, res) => {
  try {
    if (!isConnected || !pool) {
      throw new Error('No hay conexión activa con SQL Server');
    }
    
    const request = pool.request();
    
    const query = `
      SELECT TOP 200
      [IdCita] AS Registro,
      [HorSitCita] AS CitMod,
      FecAlta AS FechaAlta,
      [NUMPAC] AS NumPac,
      CASE 
          WHEN CHARINDEX(',', Texto) > 0 THEN LTRIM(RTRIM(LEFT(Texto, CHARINDEX(',', Texto) - 1)))
          ELSE NULL
      END AS Apellidos,
      CASE 
          WHEN CHARINDEX(',', Texto) > 0 THEN LTRIM(RTRIM(SUBSTRING(Texto, CHARINDEX(',', Texto) + 1, LEN(Texto))))
          ELSE Texto
      END AS Nombre,
      Movil AS TelMovil,
      CONVERT(VARCHAR(10), DATEADD(DAY, Fecha - 2, '1900-01-01'), 23) AS Fecha,
      CONVERT(VARCHAR(5), DATEADD(SECOND, Hora, 0), 108) AS Hora,
      CASE 
          WHEN IdSitC = 0 THEN 'Planificada'
          WHEN IdSitC = 1 THEN 'Anulada'
          WHEN IdSitC = 5 THEN 'Finalizada'
          WHEN IdSitC = 7 THEN 'Confirmada'
          WHEN IdSitC = 8 THEN 'Cancelada'
          ELSE 'Desconocido'
      END AS EstadoCita,
      CASE 
          WHEN IdIcono = 1 THEN 'Revision'
          WHEN IdIcono = 2 THEN 'Urgencia'
          WHEN IdIcono = 9 THEN 'Periodoncia'
          WHEN IdIcono = 10 THEN 'Cirugia Implantes'
          WHEN IdIcono = 11 THEN 'Ortodoncia'
          WHEN IdIcono = 13 THEN 'Primera'
          WHEN IdIcono = 14 THEN 'Higiene dental'
          ELSE 'Otros'
      END AS Tratamiento,
      CASE 
          WHEN IdUsu = 3 THEN 'Dr. Mario Rubio'
          WHEN IdUsu = 4 THEN 'Dra. Irene Garcia'
          WHEN IdUsu = 8 THEN 'Dra. Virginia Tresgallo'
          WHEN IdUsu = 10 THEN 'Dra. Miriam Carrasco'
          WHEN IdUsu = 12 THEN 'Dr. Juan Antonio Manzanedo'
          ELSE 'Odontologo'
      END AS Odontologo,
      NOTAS AS Notas
      FROM dbo.DCitas
      WHERE Fecha >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 60, 0)
      ORDER BY HorSitCita DESC;
    `;
    
    logMessage('Ejecutando consulta SQL...');
    const result = await request.query(query);
    const appointments = result.recordset;
    
    // Process changes
    const { newAppointments, updatedAppointments } = processAppointmentChanges(appointments);
    
    // Save to file for backup
    saveDataToFile(appointments);
    
    logMessage(`Consulta ejecutada exitosamente. ${appointments.length} registros obtenidos (${newAppointments.length} nuevos, ${updatedAppointments.length} actualizados)`);
    
    // Return data with metadata
    res.json({
      appointments,
      metadata: {
        total: appointments.length,
        new_count: newAppointments.length,
        updated_count: updatedAppointments.length,
        timestamp: new Date().toISOString(),
        server: config.server,
        database: config.database
      },
      new_appointments: newAppointments,
      updated_appointments: updatedAppointments
    });
    
  } catch (err) {
    logMessage(`Error ejecutando consulta: ${err.message}`);
    
    // Try to return cached data from file if available
    try {
      if (fs.existsSync('appointments_data.json')) {
        const cachedData = JSON.parse(fs.readFileSync('appointments_data.json', 'utf8'));
        logMessage('Devolviendo datos en caché del archivo local');
        res.json({
          appointments: cachedData.appointments || [],
          metadata: {
            total: cachedData.total_count || 0,
            cached: true,
            timestamp: cachedData.timestamp,
            error: err.message
          }
        });
        return;
      }
    } catch (fileError) {
      logMessage(`Error leyendo archivo de caché: ${fileError.message}`);
    }
    
    res.status(500).json({ 
      error: err.message,
      timestamp: new Date().toISOString(),
      server_status: isConnected ? 'connected' : 'disconnected'
    });
  }
});

// API endpoint to update appointment status
app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!isConnected || !pool) {
      throw new Error('No hay conexión activa con SQL Server');
    }
    
    // Map status to SQL Server values
    const statusMap = {
      'scheduled': 0,    // Planificada
      'confirmed': 7,    // Confirmada
      'completed': 5,    // Finalizada
      'cancelled': 8,    // Cancelada
      'no-show': 1       // Anulada
    };
    
    const sqlStatus = statusMap[status];
    if (sqlStatus === undefined) {
      return res.status(400).json({ error: 'Estado de cita inválido' });
    }
    
    const request = pool.request();
    const query = `
      UPDATE dbo.DCitas 
      SET IdSitC = @status, 
          HorSitCita = GETDATE()
      WHERE IdCita = @id
    `;
    
    request.input('status', sql.Int, sqlStatus);
    request.input('id', sql.VarChar, id);
    
    const result = await request.query(query);
    
    if (result.rowsAffected[0] > 0) {
      logMessage(`Estado de cita actualizado: ${id} -> ${status}`);
      res.json({ success: true, message: 'Estado actualizado correctamente' });
    } else {
      res.status(404).json({ error: 'Cita no encontrada' });
    }
    
  } catch (err) {
    logMessage(`Error actualizando estado de cita: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: isConnected ? 'OK' : 'DISCONNECTED',
    timestamp: new Date().toISOString(),
    server: config.server,
    database: config.database,
    cached_appointments: lastSyncData.size
  });
});

// Sync status endpoint
app.get('/api/sync-status', (req, res) => {
  const newCount = Array.from(lastSyncData.values()).filter(apt => apt.FechaAlta === apt.CitMod).length;
  const updatedCount = Array.from(lastSyncData.values()).filter(apt => apt.FechaAlta !== apt.CitMod).length;
  
  res.json({
    total_appointments: lastSyncData.size,
    new_appointments: newCount,
    updated_appointments: updatedCount,
    connection_status: isConnected ? 'connected' : 'disconnected',
    server: config.server,
    database: config.database,
    last_sync: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, async () => {
  logMessage(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
  logMessage(`📊 Servidor SQL: ${config.server}`);
  logMessage(`🗄️ Base de datos: ${config.database}`);
  await connectToSQL();
  
  // Set up periodic sync every 5 minutes
  setInterval(async () => {
    if (isConnected) {
      try {
        logMessage('🔄 Sincronización automática iniciada...');
        const response = await fetch(`http://localhost:${PORT}/api/appointments`);
        if (response.ok) {
          logMessage('✅ Sincronización automática completada');
        }
      } catch (error) {
        logMessage(`⚠️ Error en sincronización automática: ${error.message}`);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logMessage('\n🔄 Cerrando servidor...');
  if (pool) {
    await pool.close();
    logMessage('✅ Conexión a SQL Server cerrada');
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logMessage(`❌ Error no capturado: ${error.message}`);
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  logMessage(`❌ Promesa rechazada no manejada: ${reason}`);
  console.error(reason);
});