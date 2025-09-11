#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de sincronización SQL Server -> App Clínica Dental
Ejecuta cada 5 minutos para sincronizar citas desde SQL Server
Autor: Sistema de Gestión Clínica Dental
Fecha: 2025-01-11
"""

import pyodbc
import json
import requests
import logging
from datetime import datetime, timedelta
import os
import sys
from typing import List, Dict, Any, Optional

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sql_sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de la base de datos - ACTUALIZADA CON TUS DATOS
DB_CONFIG = {
    'server': 'GABINETE2\\INFOMED',  # Tu servidor SQL Server
    'database': 'GELITE',  # Tu base de datos
    'driver': 'ODBC Driver 17 for SQL Server',
    'trusted_connection': 'yes'
}

# Configuración de archivos locales (sin necesidad de API)
APP_CONFIG = {
    'data_file': 'appointments_data.json',  # Archivo donde la app lee los datos
    'backup_file': 'appointments_backup.json',  # Archivo de respaldo
    'use_api': False  # Usar archivos locales en lugar de API
}

# Archivo para guardar el estado de la última sincronización
STATE_FILE = 'last_sync_state.json'

class SQLSyncService:
    def __init__(self):
        self.last_sync_data = self.load_last_sync_state()
        
    def log_message(self, message: str, level: str = 'info'):
        """Registra un mensaje en el log"""
        if level == 'error':
            logger.error(message)
        elif level == 'warning':
            logger.warning(message)
        else:
            logger.info(message)
    
    def load_last_sync_state(self) -> Dict[str, Any]:
        """Carga el estado de la última sincronización"""
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            self.log_message(f"Error cargando estado anterior: {e}", 'warning')
        return {}
    
    def save_sync_state(self, appointments: List[Dict[str, Any]]):
        """Guarda el estado actual de las citas"""
        try:
            state = {
                'last_sync': datetime.now().isoformat(),
                'appointments': {apt['Registro']: apt for apt in appointments}
            }
            with open(STATE_FILE, 'w', encoding='utf-8') as f:
                json.dump(state, f, ensure_ascii=False, indent=2)
            self.log_message(f"Estado guardado: {len(appointments)} citas")
        except Exception as e:
            self.log_message(f"Error guardando estado: {e}", 'error')
    
    def connect_to_sql_server(self) -> pyodbc.Connection:
        """Establece conexión con SQL Server"""
        try:
            connection_string = (
                f"DRIVER={{{DB_CONFIG['driver']}}};"
                f"SERVER={DB_CONFIG['server']};"
                f"DATABASE={DB_CONFIG['database']};"
                f"Trusted_Connection={DB_CONFIG['trusted_connection']};"
            )
            
            self.log_message(f"Conectando a SQL Server: {DB_CONFIG['server']}/{DB_CONFIG['database']}")
            conn = pyodbc.connect(connection_string)
            self.log_message("Conexión establecida correctamente.")
            return conn
        except Exception as e:
            self.log_message(f"Error conectando a SQL Server: {e}", 'error')
            raise
    
    def fetch_appointments_from_sql(self) -> List[Dict[str, Any]]:
        """Obtiene las citas desde SQL Server"""
        query = """
        SELECT TOP 100
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
        WHERE Fecha >= DATEDIFF(DAY, '1900-01-01', GETDATE() - 90)  -- Últimos 90 días
        ORDER BY HorSitCita DESC;
        """
        
        conn = None
        try:
            conn = self.connect_to_sql_server()
            cursor = conn.cursor()
            
            self.log_message("Ejecutando consulta SQL...")
            cursor.execute(query)
            
            # Obtener nombres de columnas
            columns = [column[0] for column in cursor.description]
            
            # Obtener datos
            rows = cursor.fetchall()
            
            # Convertir a lista de diccionarios
            appointments = []
            for row in rows:
                appointment = dict(zip(columns, row))
                # Convertir datetime a string si es necesario
                for key, value in appointment.items():
                    if isinstance(value, datetime):
                        appointment[key] = value.isoformat()
                appointments.append(appointment)
            
            self.log_message(f"Consulta ejecutada. Se encontraron {len(appointments)} registros.")
            return appointments
            
        except Exception as e:
            self.log_message(f"Error ejecutando consulta SQL: {e}", 'error')
            raise
        finally:
            if conn:
                conn.close()
    
    def analyze_changes(self, current_appointments: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Analiza los cambios entre la sincronización anterior y actual"""
        new_appointments = []
        updated_appointments = []
        all_appointments = current_appointments
        
        # Obtener citas de la sincronización anterior
        previous_appointments = self.last_sync_data.get('appointments', {})
        
        for appointment in current_appointments:
            registro = str(appointment['Registro'])
            fecha_alta = appointment.get('FechaAlta', '')
            cit_mod = appointment.get('CitMod', '')
            
            # Verificar si es una cita nueva (FechaAlta == CitMod)
            if fecha_alta == cit_mod:
                if registro not in previous_appointments:
                    new_appointments.append(appointment)
                    self.log_message(f"Nueva cita detectada: {registro} - {appointment.get('Nombre', '')} {appointment.get('Apellidos', '')}")
            else:
                # Es una actualización (FechaAlta != CitMod)
                if registro in previous_appointments:
                    # Verificar si hay cambios reales
                    if self.has_appointment_changed(previous_appointments[registro], appointment):
                        updated_appointments.append(appointment)
                        self.log_message(f"Cita actualizada: {registro} - {appointment.get('Nombre', '')} {appointment.get('Apellidos', '')}")
                else:
                    # Tratar como nueva si no la tenemos en caché
                    new_appointments.append(appointment)
                    self.log_message(f"Nueva cita (no en caché): {registro} - {appointment.get('Nombre', '')} {appointment.get('Apellidos', '')}")
        
        return {
            'new': new_appointments,
            'updated': updated_appointments,
            'all': all_appointments
        }
    
    def has_appointment_changed(self, previous: Dict[str, Any], current: Dict[str, Any]) -> bool:
        """Verifica si una cita ha cambiado"""
        # Campos importantes para comparar
        fields_to_compare = [
            'Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 
            'Odontologo', 'Notas', 'TelMovil', 'Nombre', 'Apellidos'
        ]
        
        for field in fields_to_compare:
            if str(previous.get(field, '')) != str(current.get(field, '')):
                self.log_message(f"Campo cambiado '{field}': '{previous.get(field, '')}' -> '{current.get(field, '')}'")
                return True
        
        return False
    
    def save_for_app(self, data: Dict[str, Any]) -> bool:
        """Guarda los datos en formato que la app puede leer"""
        try:
            # Convertir datos al formato que espera la app React Native
            formatted_data = self.format_data_for_app(data)
            
            # Guardar archivo principal para la app
            with open(APP_CONFIG['data_file'], 'w', encoding='utf-8') as f:
                json.dump(formatted_data, f, ensure_ascii=False, indent=2)
            
            # Guardar archivo de respaldo
            with open(APP_CONFIG['backup_file'], 'w', encoding='utf-8') as f:
                json.dump({
                    'timestamp': datetime.now().isoformat(),
                    'raw_data': data,
                    'formatted_data': formatted_data
                }, f, ensure_ascii=False, indent=2)
            
            self.log_message(f"Datos guardados para la app: {APP_CONFIG['data_file']}")
            self.log_message(f"Nuevas: {len(data['new'])}, Actualizadas: {len(data['updated'])}, Total: {len(data['all'])}")
            
            return True
                
        except Exception as e:
            self.log_message(f"Error guardando datos para la app: {e}", 'error')
            return False
    
    def format_data_for_app(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convierte los datos de SQL al formato que espera la app React Native"""
        appointments = []
        patients = {}
        
        for apt in data['all']:
            # Formatear cita para la app
            formatted_apt = {
                'id': str(apt['Registro']),
                'patientId': str(apt.get('NumPac', apt['Registro'])),
                'patientName': f"{apt.get('Nombre', '')} {apt.get('Apellidos', '')}".strip(),
                'date': apt.get('Fecha', ''),
                'time': apt.get('Hora', ''),
                'treatment': apt.get('Tratamiento', 'Consulta general'),
                'status': self.map_status_to_app(apt.get('EstadoCita', '')),
                'notes': apt.get('Notas', ''),
                'dentist': apt.get('Odontologo', ''),
                'startDateTime': f"{apt.get('Fecha', '')}T{apt.get('Hora', '')}:00" if apt.get('Fecha') and apt.get('Hora') else '',
                'phone': apt.get('TelMovil', '')
            }
            appointments.append(formatted_apt)
            
            # Crear/actualizar paciente
            patient_id = formatted_apt['patientId']
            if patient_id not in patients:
                patients[patient_id] = {
                    'id': patient_id,
                    'name': formatted_apt['patientName'],
                    'phone': formatted_apt['phone'],
                    'appointments': [],
                    'lastVisit': None,
                    'nextAppointment': None
                }
            
            patients[patient_id]['appointments'].append(formatted_apt)
        
        # Calcular últimas visitas y próximas citas
        for patient in patients.values():
            completed_visits = [apt for apt in patient['appointments'] if apt['status'] == 'completed']
            scheduled_visits = [apt for apt in patient['appointments'] if apt['status'] == 'scheduled']
            
            if completed_visits:
                patient['lastVisit'] = max(completed_visits, key=lambda x: x['date'])['date']
            if scheduled_visits:
                patient['nextAppointment'] = min(scheduled_visits, key=lambda x: x['date'])['date']
        
        return {
            'appointments': appointments,
            'patients': list(patients.values()),
            'metadata': {
                'last_updated': datetime.now().isoformat(),
                'total_appointments': len(appointments),
                'total_patients': len(patients),
                'new_appointments': len(data['new']),
                'updated_appointments': len(data['updated']),
                'sync_source': 'SQL_Server_Direct',
                'server': DB_CONFIG['server'],
                'database': DB_CONFIG['database']
            }
        }
    
    def map_status_to_app(self, sql_status: str) -> str:
        """Mapea el estado de SQL al formato de la app"""
        status = sql_status.lower() if sql_status else ''
        
        if 'planificada' in status or 'confirmada' in status:
            return 'scheduled'
        elif 'finalizada' in status:
            return 'completed'
        elif 'anulada' in status or 'cancelada' in status:
            return 'cancelled'
        else:
            return 'scheduled'  # Por defecto
    
    def save_to_json_file(self, data: Dict[str, Any], filename: str = 'appointments_sync.json'):
        """Guarda los datos en un archivo JSON como respaldo"""
        try:
            backup_data = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'new_appointments': len(data['new']),
                    'updated_appointments': len(data['updated']),
                    'total_appointments': len(data['all'])
                },
                'data': data
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2)
            
            self.log_message(f"Datos guardados en archivo de respaldo: {filename}")
        except Exception as e:
            self.log_message(f"Error guardando archivo de respaldo: {e}", 'error')
    
    def run_sync(self) -> bool:
        """Ejecuta el proceso completo de sincronización"""
        try:
            self.log_message("=== INICIANDO SINCRONIZACIÓN ===")
            start_time = datetime.now()
            
            # 1. Obtener citas desde SQL Server
            current_appointments = self.fetch_appointments_from_sql()
            
            if not current_appointments:
                self.log_message("No se encontraron citas en SQL Server")
                return True
            
            # 2. Analizar cambios
            changes = self.analyze_changes(current_appointments)
            
            # 3. Guardar archivo de respaldo
            self.save_to_json_file(changes)
            
            # 4. Guardar datos para la aplicación
            success = self.save_for_app(changes)
            if not success:
                self.log_message("Error guardando datos para la app", 'error')
            elif not (changes['new'] or changes['updated']):
                self.log_message("No hay cambios nuevos, pero datos actualizados")
            
            # 5. Guardar estado actual
            self.save_sync_state(current_appointments)
            
            # 6. Estadísticas finales
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.log_message(f"=== SINCRONIZACIÓN COMPLETADA ===")
            self.log_message(f"Duración: {duration:.2f} segundos")
            self.log_message(f"Nuevas citas: {len(changes['new'])}")
            self.log_message(f"Citas actualizadas: {len(changes['updated'])}")
            self.log_message(f"Total citas procesadas: {len(changes['all'])}")
            
            return success
            
        except Exception as e:
            self.log_message(f"Error crítico en sincronización: {e}", 'error')
            return False

def main():
    """Función principal"""
    try:
        sync_service = SQLSyncService()
        success = sync_service.run_sync()
        
        if success:
            sys.exit(0)  # Éxito
        else:
            sys.exit(1)  # Error
            
    except KeyboardInterrupt:
        logger.info("Sincronización interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()