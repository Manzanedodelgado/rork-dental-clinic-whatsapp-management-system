# 🏥 GUÍA COMPLETA DE CONFIGURACIÓN - SISTEMA ROBUSTO SQL SERVER

## 📋 RESUMEN DEL SISTEMA

Este sistema robusto conecta tu aplicación React Native con SQL Server de forma directa, eliminando la dependencia de Google Sheets. Incluye:

- ✅ **Backend Node.js** con conexión directa a SQL Server
- ✅ **Script Python robusto** para sincronización automática
- ✅ **Detección inteligente** de citas nuevas vs actualizadas
- ✅ **Sistema de respaldo** con archivos JSON locales
- ✅ **Programador de tareas** para ejecución automática cada 5 minutos
- ✅ **Manejo de errores** y reconexión automática

---

## 🚀 INSTALACIÓN PASO A PASO

### 1️⃣ PREPARAR EL ENTORNO

#### Instalar Node.js
1. Descargar desde: https://nodejs.org (versión LTS recomendada)
2. Ejecutar instalador y seguir instrucciones
3. Verificar instalación:
   ```cmd
   node --version
   npm --version
   ```

#### Instalar Python
1. Descargar desde: https://python.org (versión 3.8 o superior)
2. **IMPORTANTE**: Marcar "Add Python to PATH" durante instalación
3. Verificar instalación:
   ```cmd
   python --version
   pip --version
   ```

### 2️⃣ CONFIGURAR BACKEND NODE.JS

#### Crear directorio del proyecto
```cmd
mkdir C:\Clinica\Backend
cd C:\Clinica\Backend
```

#### Instalar dependencias
```cmd
npm init -y
npm install express mssql cors
```

#### Copiar archivos
- Copiar `backend-server.js` al directorio `C:\Clinica\Backend\`
- El archivo ya está configurado para tu servidor: `GABINETE2\INFOMED` y base de datos: `GELITE`

#### Probar el backend
```cmd
cd C:\Clinica\Backend
node backend-server.js
```

Deberías ver:
```
🚀 Servidor backend ejecutándose en puerto 3001
📊 Servidor SQL: GABINETE2\INFOMED
🗄️ Base de datos: GELITE
✅ Conectado a SQL Server exitosamente
```

#### Verificar conexión
Abrir navegador en: http://localhost:3001/api/health

### 3️⃣ CONFIGURAR SCRIPT PYTHON

#### Instalar dependencias Python
```cmd
pip install pyodbc requests
```

#### Copiar archivos Python
- Copiar `sql_sync_robust.py` a: `C:\Users\Clinica\Streaming de Google Drive\App Gestion\`
- Copiar `run_sql_sync.bat` a la misma ubicación

#### Probar script Python
```cmd
cd "C:\Users\Clinica\Streaming de Google Drive\App Gestion"
python sql_sync_robust.py
```

### 4️⃣ CONFIGURAR PROGRAMADOR DE TAREAS

#### Abrir Programador de Tareas
1. Presionar `Win + R`
2. Escribir `taskschd.msc` y presionar Enter

#### Crear nueva tarea
1. Clic en "Crear tarea básica..."
2. **Nombre**: `Sync Citas SQL`
3. **Descripción**: `Sincronización automática de citas cada 5 minutos`

#### Configurar desencadenador
1. **Iniciar**: `Diariamente`
2. **Fecha inicio**: Hoy
3. **Repetir cada**: `5 minutos`
4. **Durante**: `Indefinidamente`

#### Configurar acción
1. **Acción**: `Iniciar un programa`
2. **Programa**: `python`
3. **Argumentos**: `"C:\Users\Clinica\Streaming de Google Drive\App Gestion\sql_sync_robust.py"`
4. **Directorio**: `"C:\Users\Clinica\Streaming de Google Drive\App Gestion"`

#### Configurar condiciones
- ✅ Marcar "Ejecutar tanto si el usuario ha iniciado sesión como si no"
- ✅ Marcar "Ejecutar con los privilegios más altos"
- ✅ Desmarcar "Iniciar la tarea solo si el equipo está conectado a la corriente alterna"

---

## 🔧 CONFIGURACIÓN AVANZADA

### Configurar Backend como Servicio Windows

#### Instalar PM2 (Administrador de procesos)
```cmd
npm install -g pm2
npm install -g pm2-windows-service
```

#### Configurar servicio
```cmd
cd C:\Clinica\Backend
pm2 start backend-server.js --name "ClinicaBackend"
pm2 save
pm2-service-install
```

### Configurar Logs Avanzados

#### Para Backend Node.js
Agregar al `backend-server.js`:
```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'backend.log' })
  ]
});
```

---

## 🔍 VERIFICACIÓN Y DIAGNÓSTICO

### Verificar Estado del Sistema

#### 1. Verificar Backend
```cmd
curl http://localhost:3001/api/health
```

#### 2. Verificar Sincronización
```cmd
curl http://localhost:3001/api/sync-status
```

#### 3. Verificar Archivo de Datos
Comprobar que existe: `C:\Users\Clinica\Streaming de Google Drive\App Gestion\appointments_data.json`

### Logs del Sistema

#### Backend Logs
- Ubicación: Consola donde se ejecuta `node backend-server.js`
- Para logs persistentes, usar PM2 o redirigir salida

#### Python Logs
- Ubicación: `C:\Users\Clinica\Streaming de Google Drive\App Gestion\sql_sync.log`
- Rotación automática cuando supera 10MB

#### Programador de Tareas Logs
1. Abrir Programador de Tareas
2. Buscar "Sync Citas SQL"
3. Ver "Historial" en panel derecho

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "No se puede conectar a SQL Server"

#### Verificar conectividad
```cmd
sqlcmd -S GABINETE2\INFOMED -E -Q "SELECT @@VERSION"
```

#### Verificar servicios SQL Server
1. Abrir "Servicios" (services.msc)
2. Verificar que "SQL Server (INFOMED)" esté ejecutándose
3. Verificar que "SQL Server Browser" esté ejecutándose

### Error: "Backend API no disponible"

#### Verificar puerto
```cmd
netstat -an | findstr :3001
```

#### Reiniciar backend
```cmd
cd C:\Clinica\Backend
taskkill /f /im node.exe
node backend-server.js
```

### Error: "Python no encontrado"

#### Verificar PATH
```cmd
where python
```

#### Reinstalar Python
- Desinstalar Python actual
- Reinstalar marcando "Add Python to PATH"

### Error: "Archivo appointments_data.json no se crea"

#### Verificar permisos
1. Clic derecho en carpeta "App Gestion"
2. Propiedades → Seguridad
3. Verificar permisos de escritura

#### Ejecutar como administrador
```cmd
# Ejecutar CMD como administrador
cd "C:\Users\Clinica\Streaming de Google Drive\App Gestion"
python sql_sync_robust.py
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### Métricas Importantes

#### Backend API
- **Endpoint**: http://localhost:3001/api/sync-status
- **Métricas**: Total citas, nuevas, actualizadas, estado conexión

#### Archivo JSON
- **Ubicación**: appointments_data.json
- **Verificar**: timestamp, total_count, server_info

#### Logs Python
- **Ubicación**: sql_sync.log
- **Buscar**: "✅ SINCRONIZACIÓN COMPLETADA", errores "❌"

### Mantenimiento Rutinario

#### Semanal
- Verificar logs de errores
- Comprobar espacio en disco
- Verificar que la tarea programada se ejecute

#### Mensual
- Limpiar logs antiguos (>30 días)
- Verificar rendimiento de consultas SQL
- Actualizar dependencias si es necesario

---

## 🔄 FLUJO DE DATOS

```
SQL Server (GELITE) 
    ↓ (cada 5 min)
Python Script (sql_sync_robust.py)
    ↓ (genera)
appointments_data.json
    ↓ (lee)
React Native App
    ↓ (también puede leer de)
Backend API (Node.js)
    ↓ (conecta directamente a)
SQL Server (GELITE)
```

### Lógica de Detección de Cambios

#### Cita Nueva
- `FechaAlta == CitMod`
- No existe en caché local

#### Cita Actualizada  
- `FechaAlta != CitMod`
- Existe en caché local
- Campos han cambiado

---

## 📞 SOPORTE Y CONTACTO

### Archivos Importantes
- `backend-server.js` - Servidor API Node.js
- `sql_sync_robust.py` - Script de sincronización Python
- `run_sql_sync.bat` - Script de ejecución por lotes
- `appointments_data.json` - Datos sincronizados
- `sql_sync.log` - Logs de sincronización

### Comandos Útiles
```cmd
# Verificar estado backend
curl http://localhost:3001/api/health

# Ejecutar sincronización manual
python sql_sync_robust.py

# Ver logs en tiempo real (PowerShell)
Get-Content sql_sync.log -Wait -Tail 10

# Verificar tarea programada
schtasks /query /tn "Sync Citas SQL"
```

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Node.js instalado y funcionando
- [ ] Python instalado con pyodbc y requests
- [ ] Backend Node.js ejecutándose en puerto 3001
- [ ] Script Python ejecuta sin errores
- [ ] Archivo appointments_data.json se genera
- [ ] Tarea programada configurada y activa
- [ ] Logs se generan correctamente
- [ ] App React Native lee datos correctamente

**¡Sistema robusto configurado y funcionando!** 🎉