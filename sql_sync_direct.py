import pyodbc
import json
import time
import os
from datetime import datetime
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sql_sync.log'),
        logging.StreamHandler()
    ]
)

# Configuración de la base de datos
DB_SERVER = 'GABINETE2\\INFOMED'
DB_DATABASE = 'GELITE'
OUTPUT_FILE = 'appointments_data.json'

def log_message(message):
    """Función para logging con timestamp"""
    logging.info(message)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def connect_to_sql():
    """Conectar a SQL Server"""
    try:
        log_message(f"Conectando a SQL Server: {DB_SERVER}/{DB_DATABASE}")
        conn = pyodbc.connect(
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={DB_SERVER};'
            f'DATABASE={DB_DATABASE};'
            'Trusted_Connection=yes;'
        )
        log_message("Conexión establecida correctamente.")
        return conn
    except Exception as e:
        log_message(f"Error conectando a SQL Server: {e}")
        raise

def execute_query(conn):
    """Ejecutar la consulta SQL y obtener los datos"""
    cursor = conn.cursor()
    
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
    WHERE Fecha >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 30, 0)
    ORDER BY HorSitCita DESC;
    """
    
    log_message("Ejecutando consulta SQL...")
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    log_message(f"Consulta ejecutada. Se encontraron {len(rows)} registros.")
    
    # Convertir a lista de diccionarios
    data = []
    for row in rows:
        row_dict = {}
        for i, column in enumerate(columns):
            value = row[i]
            # Convertir datetime a string si es necesario
            if hasattr(value, 'strftime'):
                value = value.strftime('%Y-%m-%d %H:%M:%S')
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
        registro = appointment['Registro']
        fecha_alta = appointment['FechaAlta']
        cit_mod = appointment['CitMod']
        
        # Si FechaAlta == CitMod, es una cita nueva
        if fecha_alta == cit_mod:
            if registro not in previous_data:
                new_appointments.append(appointment)
                log_message(f"Nueva cita detectada: {registro}")
        else:
            # Si FechaAlta != CitMod, es una actualización
            if registro in previous_data:
                # Verificar si hay cambios reales
                if has_changes(previous_data[registro], appointment):
                    updated_appointments.append(appointment)
                    log_message(f"Cita actualizada detectada: {registro}")
            else:
                # Tratar como nueva si no la tenemos en caché
                new_appointments.append(appointment)
    
    return new_appointments, updated_appointments

def has_changes(old_appointment, new_appointment):
    """Verificar si hay cambios en campos importantes"""
    fields_to_compare = ['Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 'Odontologo', 'Notas', 'TelMovil']
    
    for field in fields_to_compare:
        if old_appointment.get(field) != new_appointment.get(field):
            return True
    return False

def save_data(data, filename):
    """Guardar datos en archivo JSON"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'appointments': data,
                'total_count': len(data)
            }, f, ensure_ascii=False, indent=2)
        log_message(f"Datos guardados en {filename}")
    except Exception as e:
        log_message(f"Error guardando datos: {e}")
        raise

def load_previous_data(filename):
    """Cargar datos previos del archivo JSON"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                appointments = data.get('appointments', [])
                # Convertir a diccionario indexado por Registro
                return {apt['Registro']: apt for apt in appointments}
        return {}
    except Exception as e:
        log_message(f"Error cargando datos previos: {e}")
        return {}

def main():
    """Función principal"""
    try:
        log_message("=== Iniciando sincronización de citas ===")
        
        # Cargar datos previos
        previous_data = load_previous_data(OUTPUT_FILE)
        log_message(f"Datos previos cargados: {len(previous_data)} registros")
        
        # Conectar y obtener datos actuales
        conn = connect_to_sql()
        current_data = execute_query(conn)
        conn.close()
        
        # Procesar cambios
        new_appointments, updated_appointments = process_appointments(current_data, previous_data)
        
        # Guardar datos actualizados
        save_data(current_data, OUTPUT_FILE)
        
        # Resumen
        log_message("=== Resumen de sincronización ===")
        log_message(f"Total de citas: {len(current_data)}")
        log_message(f"Citas nuevas: {len(new_appointments)}")
        log_message(f"Citas actualizadas: {len(updated_appointments)}")
        
        if new_appointments:
            log_message("Nuevas citas:")
            for apt in new_appointments:
                log_message(f"  - {apt['Registro']}: {apt['Nombre']} {apt['Apellidos']} - {apt['Fecha']} {apt['Hora']}")
        
        if updated_appointments:
            log_message("Citas actualizadas:")
            for apt in updated_appointments:
                log_message(f"  - {apt['Registro']}: {apt['Nombre']} {apt['Apellidos']} - {apt['Fecha']} {apt['Hora']}")
        
        log_message("=== Sincronización completada ===")
        
    except Exception as e:
        log_message(f"Error en la sincronización: {e}")
        raise

if __name__ == "__main__":
    main()