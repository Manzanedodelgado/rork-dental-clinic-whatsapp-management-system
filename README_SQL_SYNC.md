# Script de Sincronización SQL Server -> App Clínica Dental

Este script sincroniza automáticamente las citas desde tu base de datos SQL Server local hacia la aplicación de gestión de la clínica dental.

## Características

- ✅ Detecta citas nuevas y modificadas automáticamente
- ✅ Sincronización cada 5 minutos mediante programador de tareas
- ✅ Logs detallados de todas las operaciones
- ✅ Archivos de respaldo en formato JSON
- ✅ Manejo robusto de errores
- ✅ Configuración personalizable

## Requisitos Previos

1. **Python 3.7 o superior**
2. **Librerías Python necesarias:**
   ```bash
   pip install pyodbc requests
   ```
3. **Driver ODBC para SQL Server:**
   - Descargar desde: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Instalar "ODBC Driver 17 for SQL Server"

## Instalación

1. **Descargar los archivos:**
   - `sql_sync_script.py` (script principal)
   - `run_sync.bat` (script de Windows)
   - `config_template.py` (plantilla de configuración)

2. **Configurar la conexión a la base de datos:**
   ```python
   # Editar las variables en sql_sync_script.py
   DB_CONFIG = {
       'server': 'TU_SERVIDOR_SQL',      # Ej: 'localhost' o 'SERVIDOR\INSTANCIA'
       'database': 'TU_BASE_DE_DATOS',   # Ej: 'ClinicaDB'
       'driver': 'ODBC Driver 17 for SQL Server',
       'trusted_connection': 'yes'        # Usar autenticación de Windows
   }
   ```

3. **Configurar la URL de tu aplicación:**
   ```python
   APP_CONFIG = {
       'base_url': 'http://localhost:3000',  # URL de tu app
       'sync_endpoint': '/api/sync-appointments',
       'api_key': 'your-api-key-here'
   }
   ```

## Configuración del Programador de Tareas (Windows)

### Opción 1: Interfaz Gráfica

1. Abrir **Programador de tareas** (taskschd.msc)
2. Crear **Tarea básica**
3. Configurar:
   - **Nombre:** "Sincronización Clínica Dental"
   - **Desencadenador:** Diariamente
   - **Repetir cada:** 5 minutos
   - **Durante:** 1 día
   - **Acción:** Iniciar programa
   - **Programa:** Ruta completa a `run_sync.bat`

### Opción 2: Línea de Comandos

```cmd
schtasks /create /tn "Sincronización Clínica Dental" /tr "C:\ruta\completa\run_sync.bat" /sc minute /mo 5 /ru SYSTEM
```

## Estructura de Archivos Generados

```
📁 Carpeta del script/
├── 📄 sql_sync_script.py      # Script principal
├── 📄 run_sync.bat            # Script de ejecución
├── 📄 sql_sync.log            # Log de operaciones
├── 📄 last_sync_state.json    # Estado de la última sincronización
├── 📄 appointments_sync.json  # Respaldo de datos sincronizados
└── 📄 sync_errors.json        # Errores si los hay
```

## Lógica de Detección de Cambios

El script implementa la lógica que especificaste:

### Citas Nuevas
- **Condición:** `FechaAlta == CitMod`
- **Acción:** Se añade como cita nueva si no existe en el estado anterior

### Citas Modificadas
- **Condición:** `FechaAlta != CitMod`
- **Acción:** Se busca por `Registro` y se comparan los campos importantes
- **Campos comparados:** Fecha, Hora, EstadoCita, Tratamiento, Odontólogo, Notas, TelMovil

## Monitoreo y Logs

### Archivo de Log (sql_sync.log)
```
2025-01-11 10:30:00 - INFO - === INICIANDO SINCRONIZACIÓN ===
2025-01-11 10:30:01 - INFO - Conectando a SQL Server: localhost/ClinicaDB
2025-01-11 10:30:01 - INFO - Conexión establecida correctamente
2025-01-11 10:30:02 - INFO - Consulta ejecutada. Se encontraron 45 registros
2025-01-11 10:30:02 - INFO - Nueva cita detectada: 1001 - María García López
2025-01-11 10:30:02 - INFO - Cita actualizada: 1002 - Carlos Ruiz Martín
2025-01-11 10:30:03 - INFO - Datos enviados correctamente a la app
2025-01-11 10:30:03 - INFO - === SINCRONIZACIÓN COMPLETADA ===
2025-01-11 10:30:03 - INFO - Duración: 2.45 segundos
2025-01-11 10:30:03 - INFO - Nuevas citas: 1
2025-01-11 10:30:03 - INFO - Citas actualizadas: 1
2025-01-11 10:30:03 - INFO - Total citas procesadas: 45
```

### Archivo de Estado (last_sync_state.json)
```json
{
  "last_sync": "2025-01-11T10:30:03.123456",
  "appointments": {
    "1001": {
      "Registro": "1001",
      "CitMod": "2025-01-11 10:30:00",
      "FechaAlta": "2025-01-11 10:30:00",
      "Nombre": "María",
      "Apellidos": "García López",
      // ... más campos
    }
  }
}
```

## Solución de Problemas

### Error de Conexión SQL Server
```
Error conectando a SQL Server: [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]Login failed
```
**Solución:** Verificar credenciales y permisos de la base de datos

### Error de Driver ODBC
```
Error: [Microsoft][ODBC Driver Manager] Data source name not found
```
**Solución:** Instalar ODBC Driver 17 for SQL Server

### Error de Conexión con la App
```
Error de conexión con la app: Connection refused
```
**Solución:** Verificar que la aplicación esté ejecutándose y la URL sea correcta

## Personalización

### Modificar la Consulta SQL
Edita la variable `query` en el método `fetch_appointments_from_sql()` para ajustar:
- Filtros de fecha
- Campos adicionales
- Condiciones específicas

### Cambiar Frecuencia de Sincronización
Modifica el programador de tareas para cambiar de 5 minutos a otro intervalo.

### Añadir Notificaciones
Puedes integrar notificaciones por email o WhatsApp en caso de errores modificando el método `log_message()`.

## Seguridad

- ✅ No almacena contraseñas en texto plano
- ✅ Usa autenticación de Windows por defecto
- ✅ Logs no contienen información sensible
- ✅ Archivos de estado con permisos restringidos

## Soporte

Para problemas o mejoras, revisa:
1. El archivo `sql_sync.log` para errores detallados
2. El estado de la conexión SQL Server
3. La conectividad con la aplicación web
4. Los permisos del usuario que ejecuta el script