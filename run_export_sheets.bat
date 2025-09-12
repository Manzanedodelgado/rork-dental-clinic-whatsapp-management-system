@echo off
setlocal enabledelayedexpansion

:: Ajusta estas variables o defínelas en el entorno
set DB_SERVER=GABINETE2\INFOMED
set DB_DATABASE=GELITE
set DB_DRIVER=ODBC Driver 17 for SQL Server
set GOOGLE_SHEET_ID=1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ
set SERVICE_ACCOUNT_FILE=service-account-key.json
set TARGET_WORKSHEET=Hoja1

:: Ejecuta exportación a Google Sheets
python gesden_to_sheets.py

endlocal
pause
