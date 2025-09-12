#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exporta citas de Gesden (SQL Server) a un archivo CSV local.
Permite filtrar por rango de fechas (columna Fecha ya transformada a YYYY-MM-DD).
Uso:
  python export_gesden_to_csv.py --out citas.csv [--from 2025-01-01] [--to 2025-12-31]
Config mediante variables de entorno:
  DB_SERVER, DB_DATABASE, DB_DRIVER
"""

import argparse
import csv
import datetime
import os
import sys
import pyodbc

DB_SERVER = os.getenv('DB_SERVER', 'GABINETE2\\INFOMED')
DB_DATABASE = os.getenv('DB_DATABASE', 'GELITE')
DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')


def log(msg: str) -> None:
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def normalize_row(row: dict) -> dict:
    out = {}
    for k, v in row.items():
        if isinstance(v, (bytes, bytearray)):
            out[k] = v.decode('utf-8', errors='ignore')
        elif isinstance(v, datetime.datetime):
            out[k] = v.strftime('%Y-%m-%d %H:%M:%S')
        elif v is None:
            out[k] = ''
        else:
            out[k] = str(v)
    return out


def build_query(date_from: str | None, date_to: str | None) -> tuple[str, list]:
    base = """
    SELECT
      IdCita AS Registro,
      HorSitCita AS CitMod,
      FecAlta AS FechaAlta,
      NUMPAC AS NumPac,
      CASE WHEN CHARINDEX(',', Texto) > 0 THEN LTRIM(RTRIM(LEFT(Texto, CHARINDEX(',', Texto) - 1))) ELSE NULL END AS Apellidos,
      CASE WHEN CHARINDEX(',', Texto) > 0 THEN LTRIM(RTRIM(SUBSTRING(Texto, CHARINDEX(',', Texto) + 1, LEN(Texto)))) ELSE Texto END AS Nombre,
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
    """.strip()

    params: list = []
    filters: list[str] = []

    if date_from:
        filters.append("CONVERT(VARCHAR(10), DATEADD(DAY, Fecha - 2, '1900-01-01'), 23) >= ?")
        params.append(date_from)
    if date_to:
        filters.append("CONVERT(VARCHAR(10), DATEADD(DAY, Fecha - 2, '1900-01-01'), 23) <= ?")
        params.append(date_to)

    if filters:
        base += "\nWHERE " + " AND ".join(filters)

    base += "\nORDER BY HorSitCita DESC"
    return base, params


def main() -> int:
    parser = argparse.ArgumentParser(description='Exporta citas de Gesden a CSV')
    parser.add_argument('--out', required=True, help='Ruta de salida del CSV')
    parser.add_argument('--from', dest='date_from', required=False, help='Fecha desde (YYYY-MM-DD)')
    parser.add_argument('--to', dest='date_to', required=False, help='Fecha hasta (YYYY-MM-DD)')
    args = parser.parse_args()

    conn = None
    cur = None
    try:
        log(f"Conectando a SQL Server: {DB_SERVER}/{DB_DATABASE}")
        conn = pyodbc.connect(
            f"DRIVER={{{{}}}}".format(DB_DRIVER) + ";" +
            f"SERVER={DB_SERVER};" +
            f"DATABASE={DB_DATABASE};" +
            "Trusted_Connection=yes;"
        )
        cur = conn.cursor()
        query, params = build_query(args.date_from, args.date_to)
        log("Ejecutando consulta...")
        cur.execute(query, params)
        rows = cur.fetchall()
        cols = [c[0] for c in cur.description]
        log(f"Filas: {len(rows)}. Escribiendo {args.out} ...")

        with open(args.out, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(cols)
            for r in rows:
                normalized = normalize_row(dict(zip(cols, r)))
                writer.writerow([normalized.get(c, '') for c in cols])

        log("✅ Exportación completada")
        return 0
    except Exception as e:
        log(f"❌ Error: {e}")
        return 1
    finally:
        if cur:
            cur.close()
            log('Cursor cerrado')
        if conn:
            conn.close()
            log('Conexión cerrada')


if __name__ == '__main__':
    sys.exit(main())
