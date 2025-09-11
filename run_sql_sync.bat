@echo off
REM Script para ejecutar la sincronización de citas SQL Server
REM Ubicación: C:\Users\Clinica\Streaming de Google Drive\App Gestion\run_sql_sync.bat

echo ========================================
echo SINCRONIZACION DE CITAS SQL SERVER
echo ========================================
echo Fecha/Hora: %date% %time%
echo.

REM Cambiar al directorio del script
cd /d "C:\Users\Clinica\Streaming de Google Drive\App Gestion"

REM Verificar que Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Por favor instale Python desde https://python.org
    pause
    exit /b 1
)

REM Verificar que el script existe
if not exist "sql_sync_robust.py" (
    echo ERROR: No se encuentra el archivo sql_sync_robust.py
    echo Verifique que el archivo esté en la ubicación correcta
    pause
    exit /b 1
)

REM Ejecutar el script de Python
echo Ejecutando sincronización...
python sql_sync_robust.py

REM Capturar el código de salida
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% equ 0 (
    echo ✅ Sincronización completada exitosamente
) else (
    echo ❌ Error en la sincronización (Código: %EXIT_CODE%)
)

echo ========================================
echo Presione cualquier tecla para continuar...
pause >nul

exit /b %EXIT_CODE%