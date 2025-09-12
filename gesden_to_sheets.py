#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exporta citas de Gesden (SQL Server) a Google Sheets.
Elimina cualquier envío a una app SaaS y escribe directamente en una hoja llamada "Hoja1".
"""

import pyodbc
import requests
import sys
import datetime
import json
import os
import gspread
from google.oauth2.service_account import Credentials

# --- Configuración ---
DB_SERVER = os.getenv('DB_SERVER', 'GABINETE2\\INFOMED')
DB_DATABASE = os.getenv('DB_DATABASE', 'GELITE')
DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')

# Google Sheets configuración
GOOGLE_SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ')
SERVICE_ACCOUNT_FILE = os.getenv('SERVICE_ACCOUNT_FILE', 'service-account-key.json')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')
TARGET_WORKSHEET = os.getenv('TARGET_WORKSHEET', 'Hoja1')

# --- Logger ---
def log_message(message: str):
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

# --- Función para enviar a Google Sheets ---
def send_to_google_sheets(data: dict) -> bool:
    """Envía datos directamente a Google Sheets usando Service Account o REST como fallback"""
    try:
        try:
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]

            credentials = Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE,
                scopes=scopes
            )

            gc = gspread.authorize(credentials)
            spreadsheet = gc.open_by_key(GOOGLE_SHEET_ID)

            try:
                sheet = spreadsheet.worksheet(TARGET_WORKSHEET)
                log_message(f"    📋 Usando hoja '{TARGET_WORKSHEET}'")
            except gspread.exceptions.WorksheetNotFound:
                sheet = spreadsheet.sheet1
                log_message("    📋 'Hoja1' no encontrada, usando la primera hoja")

            log_message("    📝 Escribiendo con Service Account...")
        except Exception as e:
            log_message(f"    ⚠️  Service Account falló: {e}")
            log_message("    🔄 Intentando método alternativo con API REST...")
            return send_to_google_sheets_api_rest(data)

        row_data = [
            data.get('Registro', ''),
            data.get('CitMod', ''),
            data.get('FechaAlta', ''),
            data.get('NumPac', ''),
            data.get('Apellidos', ''),
            data.get('Nombre', ''),
            data.get('TelMovil', ''),
            data.get('Fecha', ''),
            data.get('Hora', ''),
            data.get('EstadoCita', ''),
            data.get('Tratamiento', ''),
            data.get('Odontologo', ''),
            data.get('Notas', ''),
            data.get('Duracion', ''),
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ]

        sheet.append_row(row_data)
        log_message(f"✅ Google Sheets: Registro {data.get('Registro', '')} enviado correctamente")
        return True

    except Exception as e:
        log_message(f"❌ ERROR Google Sheets: {e}")
        return False


def send_to_google_sheets_api_rest(data: dict) -> bool:
    """Método alternativo: enviar a Google Sheets usando API REST"""
    try:
        if not GOOGLE_API_KEY:
            log_message("❌ ERROR API REST: Falta GOOGLE_API_KEY")
            return False

        row_data = [
            data.get('Registro', ''),
            data.get('CitMod', ''),
            data.get('FechaAlta', ''),
            data.get('NumPac', ''),
            data.get('Apellidos', ''),
            data.get('Nombre', ''),
            data.get('TelMovil', ''),
            data.get('Fecha', ''),
            data.get('Hora', ''),
            data.get('EstadoCita', ''),
            data.get('Tratamiento', ''),
            data.get('Odontologo', ''),
            data.get('Notas', ''),
            data.get('Duracion', ''),
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ]

        url = f"https://sheets.googleapis.com/v4/spreadsheets/{GOOGLE_SHEET_ID}/values/{TARGET_WORKSHEET}!A:O:append"
        headers = { 'Content-Type': 'application/json' }
        payload = { "range": f"{TARGET_WORKSHEET}!A:O", "majorDimension": "ROWS", "values": [row_data] }
        params = { 'key': GOOGLE_API_KEY, 'valueInputOption': 'RAW', 'insertDataOption': 'INSERT_ROWS' }

        response = requests.post(url, headers=headers, json=payload, params=params, timeout=30)

        if response.status_code in (200, 201):
            log_message(f"✅ Google Sheets REST API: Registro {data.get('Registro', '')} enviado correctamente")
            return True
        else:
            log_message(f"❌ ERROR API REST: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        log_message(f"❌ ERROR Google Sheets API REST: {e}")
        return False


# --- Conexión SQL Server ---

def fetch_rows_from_sql():
    conn = None
    cursor = None
    try:
        log_message(f"🚀 INICIO - Extracción Gesden -> Google Sheets")
        log_message(f"Conectando a SQL Server: {DB_SERVER}/{DB_DATABASE}")

        conn = pyodbc.connect(
            f'DRIVER={{{{}}}}'.format(DB_DRIVER) + ';' +
            f'SERVER={DB_SERVER};' +
            f'DATABASE={DB_DATABASE};' +
            'Trusted_Connection=yes;'
        )
        cursor = conn.cursor()
        log_message("✅ Conexión SQL Server establecida correctamente.")

        query = """
        SELECT TOP 100
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

        log_message("Ejecutando consulta SQL...")
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        log_message(f"✅ Consulta ejecutada. Se encontraron {len(rows)} registros.")
        return [dict(zip(columns, row)) for row in rows]

    except pyodbc.Error as ex:
        log_message(f"❌ ERROR BD: {ex}")
        raise
    except Exception as e:
        log_message(f"❌ ERROR CRÍTICO: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
            log_message("🔒 Cursor cerrado.")
        if conn:
            conn.close()
            log_message("🔒 Conexión cerrada.")


def normalize_row(data: dict) -> dict:
    normalized = {}
    for key, value in data.items():
        if isinstance(value, (bytes, bytearray)):
            normalized[key] = value.decode('utf-8', errors='ignore')
        elif isinstance(value, datetime.datetime):
            normalized[key] = value.strftime("%Y-%m-%d %H:%M:%S")
        elif value is None:
            normalized[key] = ""
        else:
            normalized[key] = str(value)
    return normalized


def main():
    try:
        rows = fetch_rows_from_sql()
        if not rows:
            log_message("ℹ️  No hay registros para exportar.")
            sys.exit(0)

        ok = 0
        for i, row in enumerate(rows):
            data = normalize_row(row)
            log_message(f"➡️  [{i+1}/{len(rows)}] Enviando Registro: {data.get('Registro','')}")
            if send_to_google_sheets(data):
                ok += 1

        log_message("\n📊 RESUMEN:")
        log_message(f"    Total: {len(rows)}")
        log_message(f"    Exitosos a Sheets: {ok}/{len(rows)}")

        sys.exit(0 if ok > 0 else 1)
    except Exception:
        sys.exit(1)


if __name__ == "__main__":
    main()
