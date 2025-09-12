# Configuración para el script de sincronización SQL Server
# Copiado desde config_template.py y personalizado

# Configuración de la base de datos SQL Server
DB_CONFIG = {
    'server': 'GABINETE2\\INFOMED',
    'database': 'GELITE',
    'driver': 'ODBC Driver 17 for SQL Server',
    'trusted_connection': 'yes',
    # Si usas autenticación SQL Server, comenta 'trusted_connection' y descomenta:
    # 'username': 'tu_usuario',
    # 'password': 'tu_contraseña',
}

# Configuración de Google Sheets
GOOGLE_SHEETS_CONFIG = {
    'sheet_id': '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ',
    'service_account_file': 'service-account-key.json',
    # Nombre exacto de la pestaña dentro del Spreadsheet
    'worksheet_name': 'Hoja1',
    # Opcional: si decides usar la API REST en vez de gspread
    # 'api_key': 'TU_API_KEY_OPCIONAL_SI_USAS_API_REST',
}

# Configuración de la aplicación (solo si envías a una app externa)
APP_CONFIG = {
    'base_url': '',
    'sync_endpoint': '/api/sync-appointments',
    'api_key': '',
    'timeout': 30,
}

# Configuración de logging
LOG_CONFIG = {
    'level': 'INFO',
    'file': 'sql_sync.log',
    'max_size_mb': 10,
    'backup_count': 5,
}

# Configuración de la consulta SQL
QUERY_CONFIG = {
    'days_back': 30,
    'max_records': 1000,
    'table_name': 'dbo.DCitas',
}

# Archivos de estado y respaldo
FILES_CONFIG = {
    'state_file': 'last_sync_state.json',
    'backup_file': 'appointments_sync.json',
    'error_file': 'sync_errors.json',
}
