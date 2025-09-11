#!/usr/bin/env python3
"""
Script robusto para sincronización de citas desde SQL Server
Ejecutar cada 5 minutos mediante el Programador de Tareas de Windows

Ubicación: C:\Users\Clinica\Streaming de Google Drive\App Gestion\sql_sync_robust.py

Configuración del Programador de Tareas:
1. Abrir "Programador de tareas" (taskschd.msc)
2. Crear tarea básica
3. Nombre: "Sync Citas SQL"
4. Desencadenador: Repetir cada 5 minutos
5. Acción: Iniciar programa
6. Programa: python
7. Argumentos: "C:\Users\Clinica\Streaming de Google Drive\App Gestion\sql_sync_robust.py"
8. Directorio de inicio: "C:\Users\Clinica\Streaming de Google Drive\App Gestion"
"""

import pyodbc
import json
import time
import os
import sys
from datetime import datetime, timedelta
import logging
import traceback
import requests
from pathlib import Path

# Configuración
DB_SERVER = 'GABINETE2\\INFOMED'
DB_DATABASE = 'GELITE'
OUTPUT_FILE = 'appointments_data.json'
LOG_FILE = 'sql_sync.log'
BACKEND_URL = 'http://localhost:3001'
MAX_RETRIES = 3
RETRY_DELAY = 5  # segundos

# Configurar logging
def setup_logging():
    """Configurar sistema de logging"""
    log_format = '%(asctime)s - %(levelname)s - %(message)s'
    
    # Configurar logging a archivo y consola
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.FileHandler(LOG_FILE, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Crear logger personalizado
    logger = logging.getLogger('SQLSync')
    return logger

logger = setup_logging()

def log_message(message, level='info'):
    """Función para logging con diferentes niveles"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    formatted_message = f"[{timestamp}] {message}"
    
    if level == 'error':
        logger.error(formatted_message)
    elif level == 'warning':
        logger.warning(formatted_message)
    else:
        logger.info(formatted_message)
    
    print(formatted_message)

def test_backend_connection():
    """Probar conexión con el backend API"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_message(f"✅ Backend API disponible - Estado: {data.get('status', 'Unknown')}")
            return True
        else:
            log_message(f"⚠️ Backend API respondió con código: {response.status_code}", 'warning')
            return False
    except requests.exceptions.RequestException as e:
        log_message(f"❌ Backend API no disponible: {e}", 'warning')
        return False

def connect_to_sql():
    """Conectar a SQL Server con reintentos"""
    for attempt in range(MAX_RETRIES):
        try:
            log_message(f"Intento {attempt + 1}/{MAX_RETRIES} - Conectando a SQL Server: {DB_SERVER}/{DB_DATABASE}")
            
            connection_string = (
                f'DRIVER={{ODBC Driver 17 for SQL Server}};'
                f'SERVER={DB_SERVER};'
                f'DATABASE={DB_DATABASE};'
                'Trusted_Connection=yes;'
                'Connection Timeout=30;'
                'Command Timeout=60;'
            )
            
            conn = pyodbc.connect(connection_string)
            log_message("✅ Conexión a SQL Server establecida correctamente")
            return conn
            
        except Exception as e:
            log_message(f"❌ Error en intento {attempt + 1}: {e}", 'error')
            if attempt < MAX_RETRIES - 1:
                log_message(f"⏳ Esperando {RETRY_DELAY} segundos antes del siguiente intento...")
                time.sleep(RETRY_DELAY)
            else:
                log_message("❌ Se agotaron todos los intentos de conexión", 'error')
                raise

def execute_query(conn):
    """Ejecutar la consulta SQL y obtener los datos"""
    cursor = conn.cursor()
    
    # Consulta SQL optimizada
    query = """
    SELECT TOP 300
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
    WHERE Fecha >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 90, 0)
    AND Fecha <= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) + 365, 0)
    ORDER BY HorSitCita DESC;
    """
    
    log_message("📊 Ejecutando consulta SQL...")
    start_time = time.time()
    
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    
    execution_time = time.time() - start_time
    log_message(f"✅ Consulta ejecutada en {execution_time:.2f}s. Se encontraron {len(rows)} registros.")
    
    # Convertir a lista de diccionarios
    data = []
    for row in rows:
        row_dict = {}
        for i, column in enumerate(columns):
            value = row[i]
            # Convertir datetime a string si es necesario
            if hasattr(value, 'strftime'):
                value = value.strftime('%Y-%m-%d %H:%M:%S')
            elif value is None:
                value = ''
            row_dict[column] = value
        data.append(row_dict)
    
    return data

def process_appointments(current_data, previous_data=None):
    """Procesar citas para identificar nuevas y actualizadas"""
    if previous_data is None:
        previous_data = {}
    
    new_appointments = []
    updated_appointments = []
    
    for appointment in current_data:
        registro = str(appointment['Registro'])
        fecha_alta = appointment['FechaAlta']
        cit_mod = appointment['CitMod']
        
        # Si FechaAlta == CitMod, es una cita nueva
        if fecha_alta == cit_mod:
            if registro not in previous_data:
                new_appointments.append(appointment)
                log_message(f"🆕 Nueva cita: {registro} - {appointment['Nombre']} {appointment['Apellidos']} - {appointment['Fecha']} {appointment['Hora']}")
        else:
            # Si FechaAlta != CitMod, es una actualización
            if registro in previous_data:
                # Verificar si hay cambios reales
                if has_changes(previous_data[registro], appointment):
                    updated_appointments.append(appointment)
                    log_message(f"🔄 Cita actualizada: {registro} - {appointment['Nombre']} {appointment['Apellidos']} - {appointment['Fecha']} {appointment['Hora']}")
            else:
                # Tratar como nueva si no la tenemos en caché
                new_appointments.append(appointment)
    
    return new_appointments, updated_appointments

def has_changes(old_appointment, new_appointment):
    """Verificar si hay cambios en campos importantes"""
    fields_to_compare = ['Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 'Odontologo', 'Notas', 'TelMovil']
    
    for field in fields_to_compare:
        old_value = str(old_appointment.get(field, '')).strip()
        new_value = str(new_appointment.get(field, '')).strip()
        if old_value != new_value:
            log_message(f"   📝 Campo '{field}' cambió: '{old_value}' -> '{new_value}'")
            return True
    return False

def save_data(data, filename):
    """Guardar datos en archivo JSON con backup"""
    try:
        # Crear backup del archivo anterior si existe
        if os.path.exists(filename):
            backup_filename = f"{filename}.backup"
            os.rename(filename, backup_filename)
            log_message(f"📁 Backup creado: {backup_filename}")
        
        # Preparar datos para guardar
        output_data = {
            'timestamp': datetime.now().isoformat(),
            'appointments': data,
            'total_count': len(data),
            'sync_info': {
                'server': DB_SERVER,
                'database': DB_DATABASE,
                'script_version': '2.0',
                'python_version': sys.version
            }
        }
        
        # Guardar archivo principal
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        log_message(f"💾 Datos guardados en {filename}")
        
        # Verificar integridad del archivo
        with open(filename, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
            if len(test_data.get('appointments', [])) != len(data):
                raise ValueError("Error de integridad en el archivo guardado")
        
        log_message("✅ Integridad del archivo verificada")
        
    except Exception as e:
        log_message(f"❌ Error guardando datos: {e}", 'error')
        # Restaurar backup si existe
        backup_filename = f"{filename}.backup"
        if os.path.exists(backup_filename):
            os.rename(backup_filename, filename)
            log_message("🔄 Archivo restaurado desde backup")
        raise

def load_previous_data(filename):
    """Cargar datos previos del archivo JSON"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                appointments = data.get('appointments', [])
                # Convertir a diccionario indexado por Registro
                previous_data = {str(apt['Registro']): apt for apt in appointments}
                log_message(f"📂 Datos previos cargados: {len(previous_data)} registros")
                return previous_data
        else:
            log_message("📂 No se encontró archivo previo, iniciando desde cero")
        return {}
    except Exception as e:
        log_message(f"⚠️ Error cargando datos previos: {e}", 'warning')
        return {}

def send_to_backend(data):
    """Enviar datos al backend API si está disponible"""
    try:
        if not test_backend_connection():
            return False
        
        # Enviar datos al backend
        response = requests.post(
            f"{BACKEND_URL}/api/sync-data",
            json={'appointments': data},
            timeout=30
        )
        
        if response.status_code == 200:
            log_message("✅ Datos enviados al backend exitosamente")
            return True
        else:
            log_message(f"⚠️ Backend respondió con código: {response.status_code}", 'warning')
            return False
            
    except Exception as e:
        log_message(f"⚠️ Error enviando datos al backend: {e}", 'warning')
        return False

def cleanup_old_files():
    """Limpiar archivos antiguos de backup y logs"""
    try:
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(days=7)  # Mantener archivos de 7 días
        
        # Limpiar backups antiguos
        for file in Path('.').glob('*.backup'):
            if file.stat().st_mtime < cutoff_time.timestamp():
                file.unlink()
                log_message(f"🗑️ Backup antiguo eliminado: {file}")
        
        # Rotar log si es muy grande (>10MB)
        if os.path.exists(LOG_FILE):
            if os.path.getsize(LOG_FILE) > 10 * 1024 * 1024:  # 10MB
                os.rename(LOG_FILE, f"{LOG_FILE}.old")
                log_message("🔄 Log rotado por tamaño")
                
    except Exception as e:
        log_message(f"⚠️ Error en limpieza de archivos: {e}", 'warning')

def main():
    """Función principal"""
    start_time = datetime.now()
    
    try:
        log_message("=" * 60)
        log_message("🚀 INICIANDO SINCRONIZACIÓN DE CITAS SQL SERVER")
        log_message(f"📅 Fecha/Hora: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        log_message(f"🖥️ Servidor: {DB_SERVER}")
        log_message(f"🗄️ Base de datos: {DB_DATABASE}")
        log_message("=" * 60)
        
        # Limpiar archivos antiguos
        cleanup_old_files()
        
        # Cargar datos previos
        previous_data = load_previous_data(OUTPUT_FILE)
        
        # Conectar y obtener datos actuales
        conn = connect_to_sql()
        try:
            current_data = execute_query(conn)
        finally:
            conn.close()
            log_message("🔌 Conexión SQL cerrada")
        
        # Procesar cambios
        new_appointments, updated_appointments = process_appointments(current_data, previous_data)
        
        # Guardar datos actualizados
        save_data(current_data, OUTPUT_FILE)
        
        # Intentar enviar al backend
        backend_success = send_to_backend(current_data)
        
        # Calcular tiempo de ejecución
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        
        # Resumen final
        log_message("=" * 60)
        log_message("📊 RESUMEN DE SINCRONIZACIÓN")
        log_message(f"⏱️ Tiempo de ejecución: {execution_time:.2f} segundos")
        log_message(f"📋 Total de citas: {len(current_data)}")
        log_message(f"🆕 Citas nuevas: {len(new_appointments)}")
        log_message(f"🔄 Citas actualizadas: {len(updated_appointments)}")
        log_message(f"🌐 Backend API: {'✅ Conectado' if backend_success else '❌ No disponible'}")
        
        if new_appointments:
            log_message("🆕 NUEVAS CITAS DETECTADAS:")
            for apt in new_appointments[:5]:  # Mostrar solo las primeras 5
                log_message(f"   • {apt['Registro']}: {apt['Nombre']} {apt['Apellidos']} - {apt['Fecha']} {apt['Hora']} ({apt['EstadoCita']})")
            if len(new_appointments) > 5:
                log_message(f"   ... y {len(new_appointments) - 5} más")
        
        if updated_appointments:
            log_message("🔄 CITAS ACTUALIZADAS:")
            for apt in updated_appointments[:5]:  # Mostrar solo las primeras 5
                log_message(f"   • {apt['Registro']}: {apt['Nombre']} {apt['Apellidos']} - {apt['Fecha']} {apt['Hora']} ({apt['EstadoCita']})")
            if len(updated_appointments) > 5:
                log_message(f"   ... y {len(updated_appointments) - 5} más")
        
        log_message("✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE")
        log_message("=" * 60)
        
        return 0  # Código de salida exitoso
        
    except Exception as e:
        error_msg = f"❌ ERROR CRÍTICO EN LA SINCRONIZACIÓN: {e}"
        log_message(error_msg, 'error')
        log_message(f"📍 Traceback: {traceback.format_exc()}", 'error')
        
        # Intentar notificar el error al backend
        try:
            if test_backend_connection():
                requests.post(
                    f"{BACKEND_URL}/api/sync-error",
                    json={'error': str(e), 'timestamp': datetime.now().isoformat()},
                    timeout=10
                )
        except:
            pass  # Ignorar errores de notificación
        
        return 1  # Código de salida con error

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)