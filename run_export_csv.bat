@echo off
setlocal enabledelayedexpansion

:: Config por entorno si quieres sobreescribir
set DB_SERVER=GABINETE2\INFOMED
set DB_DATABASE=GELITE
set DB_DRIVER=ODBC Driver 17 for SQL Server

:: Ruta de salida y filtros
set OUT=citas.csv
set FROM=
set TO=

if not "%1"=="" set OUT=%1
if not "%2"=="" set FROM=%2
if not "%3"=="" set TO=%3

set ARGS=--out "%OUT%"
if not "%FROM%"=="" set ARGS=%ARGS% --from %FROM%
if not "%TO%"=="" set ARGS=%ARGS% --to %TO%

python export_gesden_to_csv.py %ARGS%

endlocal
pause
