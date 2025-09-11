@echo off
REM Script para ejecutar la sincronización SQL Server -> App Clínica Dental
REM Configurar como tarea programada para ejecutar cada 5 minutos
REM Ruta de instalación: C:\Users\Clinica\Streaming de Google Drive\App Gestion

REM Cambiar al directorio del script
cd /d "C:\Users\Clinica\Streaming de Google Drive\App Gestion"

REM Mostrar información de inicio
echo ========================================
echo Sincronización SQL Server - App Clínica
echo Fecha/Hora: %date% %time%
echo Directorio: %cd%
echo ========================================

REM Verificar que existe el script de Python robusto
if not exist "sql_sync_robust.py" (
    echo ERROR: No se encuentra sql_sync_robust.py
    echo %date% %time% - ERROR: Script robusto no encontrado >> sync_errors.log
    exit /b 1
)

REM Activar el entorno virtual de Python si existe
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
)

REM Ejecutar el script de sincronización robusto
echo Ejecutando sincronización robusta...
python sql_sync_robust.py

REM Verificar si hubo errores
if %ERRORLEVEL% NEQ 0 (
    echo ========================================
    echo ERROR en la sincronización: %ERRORLEVEL%
    echo ========================================
    echo %date% %time% - ERROR en sincronización (código %ERRORLEVEL%) >> sync_errors.log
    exit /b %ERRORLEVEL%
) else (
    echo ========================================
    echo Sincronización completada exitosamente
    echo ========================================
    echo %date% %time% - Sincronización exitosa >> sync_success.log
)

REM Mostrar archivos generados
echo.
echo Archivos generados:
if exist "appointments_data.json" echo - appointments_data.json (para la app)
if exist "appointments_backup.json" echo - appointments_backup.json (respaldo)
if exist "last_sync_state.json" echo - last_sync_state.json (estado)
if exist "sql_sync.log" echo - sql_sync.log (log detallado)

REM Pausa opcional para ver resultados (comentar en producción)
REM pause

exit /b 0