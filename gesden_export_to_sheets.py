import os
import sys
import datetime
from typing import Any, Dict, List, Tuple

import pyodbc
import gspread
from google.oauth2.service_account import Credentials

# --- Configuración (por variables de entorno con valores por defecto) ---
DB_SERVER = os.getenv('DB_SERVER', 'GABINETE2\\INFOMED')
DB_DATABASE = os.getenv('DB_DATABASE', 'GELITE')
DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')

GOOGLE_SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ')
SERVICE_ACCOUNT_FILE = os.getenv('SERVICE_ACCOUNT_FILE', 'service-account-key.json')
TARGET_WORKSHEET = os.getenv('TARGET_WORKSHEET', 'Hoja1')

# Columnas esperadas en Google Sheets (A:O)
HEADERS = [
    'Registro', 'CitMod', 'FechaAlta', 'NumPac', 'Apellidos', 'Nombre', 'TelMovil',
    'Fecha', 'Hora', 'EstadoCita', 'Tratamiento', 'Odontologo', 'Notas', 'Duracion',
    'InsertedAt'
]

QUERY = """
    SELECT TOP 250
        IdCita AS Registro,
        HorSitCita AS CitMod,
        FecAlta AS FechaAlta,
        NUMPAC AS NumPac,
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
        CONVERT(NVARCHAR(MAX), NOTAS) AS Notas,
        CAST(CAST(Duracion AS DECIMAL(10, 2)) / 60 AS INT) AS Duracion
    FROM dbo.DCitas
    ORDER BY HorSitCita DESC;
"""


def log(msg: str) -> None:
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{now}] {msg}")


def connect_db() -> Tuple[pyodbc.Connection, pyodbc.Cursor]:
    log(f"Conectando a SQL Server: {DB_SERVER}/{DB_DATABASE}")
    conn = pyodbc.connect(
        f"DRIVER={{{{DB_DRIVER}}}};".replace('{{DB_DRIVER}}', DB_DRIVER) +
        f"SERVER={DB_SERVER};DATABASE={DB_DATABASE};Trusted_Connection=yes;",
        timeout=30,
    )
    return conn, conn.cursor()


def fetch_rows(cursor: pyodbc.Cursor) -> Tuple[List[Dict[str, Any]], List[str]]:
    log("Ejecutando consulta SQL...")
    cursor.execute(QUERY)
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]
    log(f"Consulta ejecutada. Registros: {len(rows)}")

    result: List[Dict[str, Any]] = []
    for row in rows:
        data = {k: v for k, v in zip(columns, row)}
        norm: Dict[str, str] = {}
        for key, value in data.items():
            if isinstance(value, (bytes, bytearray)):
                norm[key] = value.decode('utf-8', errors='ignore')
            elif isinstance(value, (datetime.date, datetime.datetime)):
                # Normalizamos a ISO para comparaciones y escritura
                if isinstance(value, datetime.datetime):
                    norm[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    norm[key] = value.strftime('%Y-%m-%d')
            elif value is None:
                norm[key] = ''
            else:
                norm[key] = str(value)
        result.append(norm)
    return result, columns


def authorize_sheets() -> gspread.Worksheet:
    log("Autenticando con Google Sheets (Service Account)...")
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
    ]
    credentials = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(credentials)
    ss = gc.open_by_key(GOOGLE_SHEET_ID)
    try:
        ws = ss.worksheet(TARGET_WORKSHEET)
        log(f"Usando hoja '{TARGET_WORKSHEET}'")
    except gspread.exceptions.WorksheetNotFound:
        log(f"Hoja '{TARGET_WORKSHEET}' no encontrada. Creando...")
        ws = ss.add_worksheet(title=TARGET_WORKSHEET, rows=1000, cols=20)
    # Asegurar cabeceras
    values = ws.get_all_values()
    if not values or (values and (len(values[0]) == 0 or values[0][0].strip() != 'Registro')):
        log("Escribiendo cabeceras en fila 1")
        ws.update('A1:O1', [HEADERS])
    return ws


def row_from_record(d: Dict[str, str]) -> List[str]:
    return [
        d.get('Registro', ''),
        d.get('CitMod', ''),
        d.get('FechaAlta', ''),
        d.get('NumPac', ''),
        d.get('Apellidos', ''),
        d.get('Nombre', ''),
        d.get('TelMovil', ''),
        d.get('Fecha', ''),
        d.get('Hora', ''),
        d.get('EstadoCita', ''),
        d.get('Tratamiento', ''),
        d.get('Odontologo', ''),
        d.get('Notas', ''),
        d.get('Duracion', ''),
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    ]


def build_index(ws: gspread.Worksheet) -> Dict[str, int]:
    values = ws.get_all_values()
    index: Dict[str, int] = {}
    for i, row in enumerate(values, start=1):
        if i == 1:
            continue  # header
        if not row:
            continue
        key = (row[0] if len(row) > 0 else '').strip()
        if key:
            index[key] = i
    return index


def upsert_records(ws: gspread.Worksheet, records: List[Dict[str, str]]) -> None:
    existing_index = build_index(ws)
    registros_actuales_sql = set()

    updates: List[Tuple[str, List[List[str]]]] = []  # (range, values)
    appends: List[List[str]] = []

    for d in records:
        registro = d.get('Registro', '').strip()
        if not registro:
            continue
        registros_actuales_sql.add(registro)

        citmod = d.get('CitMod', '')
        fecha_alta = d.get('FechaAlta', '')
        is_new = citmod == fecha_alta

        new_row = row_from_record(d)

        if registro in existing_index:
            row_number = existing_index[registro]
            rng = f"A{row_number}:O{row_number}"
            updates.append((rng, [new_row]))
            log(f"Programado UPDATE ({'NUEVA' if is_new else 'MOD'}): Registro {registro} -> fila {row_number}")
        else:
            appends.append(new_row)
            log(f"Programado APPEND ({'NUEVA' if is_new else 'MOD'}): Registro {registro}")

    # Ejecutar updates en lotes
    if updates:
        log(f"Ejecutando {len(updates)} updates en lotes...")
        ws.batch_update([{ 'range': r, 'values': v } for r, v in updates])

    # Ejecutar appends
    for row in appends:
        ws.append_row(row, value_input_option='RAW')
    if appends:
        log(f"Ejecutados {len(appends)} appends")

    # Borrado de citas que ya no aparecen
    existing_index_after = build_index(ws)
    registros_sheet = set(existing_index_after.keys())
    to_delete = sorted([existing_index_after[r] for r in registros_sheet - registros_actuales_sql], reverse=True)

    if to_delete:
        log(f"Eliminando {len(to_delete)} filas que ya no existen en SQL...")
        for row_num in to_delete:
            ws.delete_rows(row_num)


def main() -> int:
    log("Inicio de sincronización Gesden -> Google Sheets")
    conn = None
    cursor = None
    try:
        conn, cursor = connect_db()
        records, columns = fetch_rows(cursor)
        if not records:
            log("No hay registros para procesar.")
        else:
            log(f"Procesando {len(records)} registros...")
            ws = authorize_sheets()
            upsert_records(ws, records)
            log("Sincronización completada correctamente.")
        return 0
    except pyodbc.Error as ex:
        log(f"ERROR BD: {ex}")
        return 1
    except gspread.exceptions.APIError as ex:
        log(f"ERROR Google Sheets API: {ex}")
        return 2
    except Exception as ex:
        log(f"ERROR no controlado: {ex}")
        return 3
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
        log("Fin de proceso.")


if __name__ == '__main__':
    sys.exit(main())
