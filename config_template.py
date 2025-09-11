# Configuración para el script de sincronización SQL Server
# Copia este archivo como config.py y personaliza los valores

# Configuración de la base de datos SQL Server
DB_CONFIG = {
    'server': 'localhost',  # Cambia por tu servidor SQL Server
    'database': 'ClinicaDB',  # Cambia por el nombre de tu base de datos
    'driver': 'ODBC Driver 17 for SQL Server',  # Driver ODBC
    'trusted_connection': 'yes',  # Usar autenticación de Windows
    # Si usas autenticación SQL Server, comenta la línea anterior y descomenta estas:
    # 'username': 'tu_usuario',
    # 'password': 'tu_contraseña'
}

# Configuración de la aplicación (donde enviar los datos sincronizados)
APP_CONFIG = {
    'base_url': 'http://localhost:3000',  # URL base de tu aplicación
    'sync_endpoint': '/api/sync-appointments',  # Endpoint para recibir datos
    'api_key': 'your-api-key-here',  # Clave de API si es necesaria
    'timeout': 30  # Timeout en segundos para las peticiones HTTP
}

# Configuración de logging
LOG_CONFIG = {
    'level': 'INFO',  # Nivel de log: DEBUG, INFO, WARNING, ERROR
    'file': 'sql_sync.log',  # Archivo de log
    'max_size_mb': 10,  # Tamaño máximo del archivo de log en MB
    'backup_count': 5  # Número de archivos de backup a mantener
}

# Configuración de la consulta SQL
QUERY_CONFIG = {
    'days_back': 30,  # Número de días hacia atrás para obtener citas
    'max_records': 1000,  # Máximo número de registros a procesar
    'table_name': 'dbo.DCitas'  # Nombre de la tabla de citas
}

# Archivos de estado y respaldo
FILES_CONFIG = {
    'state_file': 'last_sync_state.json',  # Archivo para guardar el estado
    'backup_file': 'appointments_sync.json',  # Archivo de respaldo
    'error_file': 'sync_errors.json'  # Archivo para errores
}