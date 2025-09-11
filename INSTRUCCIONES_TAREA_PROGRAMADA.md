# Instrucciones para Configurar la Tarea Programada

## Archivos del Sistema de Sincronización

Guarda estos archivos en la ruta: `C:\Users\Clinica\Streaming de Google Drive\App Gestion`

### Archivos principales:
1. **sql_sync_script.py** - Script principal de sincronización
2. **run_sync.bat** - Script batch para ejecutar la sincronización
3. **INSTRUCCIONES_TAREA_PROGRAMADA.md** - Este archivo de instrucciones

### Archivos que se generarán automáticamente:
- **appointments_data.json** - Datos para la app React Native
- **appointments_backup.json** - Respaldo de los datos
- **last_sync_state.json** - Estado de la última sincronización
- **sql_sync.log** - Log detallado de las operaciones
- **sync_errors.log** - Log de errores
- **sync_success.log** - Log de sincronizaciones exitosas

## Configuración de la Tarea Programada en Windows

### Paso 1: Abrir el Programador de Tareas
1. Presiona `Windows + R`
2. Escribe `taskschd.msc` y presiona Enter
3. Se abrirá el Programador de Tareas de Windows

### Paso 2: Crear Nueva Tarea
1. En el panel derecho, haz clic en **"Crear tarea..."**
2. NO uses "Crear tarea básica", usa "Crear tarea" para tener más opciones

### Paso 3: Configurar la Pestaña "General"
- **Nombre**: `Sincronización Clínica Dental - SQL Server`
- **Descripción**: `Sincroniza citas desde SQL Server cada 5 minutos`
- **Configuración de seguridad**:
  - Selecciona "Ejecutar tanto si el usuario inició sesión como si no"
  - Marca "Ejecutar con los privilegios más altos"
  - Configura para: Windows 10/Windows Server 2016

### Paso 4: Configurar la Pestaña "Desencadenadores"
1. Haz clic en **"Nuevo..."**
2. **Iniciar la tarea**: "Según una programación"
3. **Configuración**:
   - Selecciona "Diariamente"
   - **Iniciar**: Fecha actual
   - **Hora de inicio**: 08:00:00 (o la hora que prefieras)
   - **Repetir cada**: 5 minutos
   - **Durante**: 1 día
   - Marca "Habilitado"
4. Haz clic en **"Aceptar"**

### Paso 5: Configurar la Pestaña "Acciones"
1. Haz clic en **"Nuevo..."**
2. **Acción**: "Iniciar un programa"
3. **Programa o script**: 
   ```
   C:\Users\Clinica\Streaming de Google Drive\App Gestion\run_sync.bat
   ```
4. **Iniciar en (opcional)**:
   ```
   C:\Users\Clinica\Streaming de Google Drive\App Gestion
   ```
5. Haz clic en **"Aceptar"**

### Paso 6: Configurar la Pestaña "Condiciones"
- **Energía**:
  - DESMARCA "Iniciar la tarea solo si el equipo está conectado a la corriente alterna"
  - DESMARCA "Detener si el equipo pasa a alimentación por batería"
- **Red**:
  - Puedes marcar "Iniciar solo si está disponible la siguiente conexión de red" si quieres

### Paso 7: Configurar la Pestaña "Configuración"
- **Permitir que la tarea se ejecute a petición**: ✓ Marcado
- **Ejecutar la tarea lo antes posible después de una hora de inicio programada perdida**: ✓ Marcado
- **Si la tarea da error, reiniciar cada**: 1 minuto
- **Intentar reiniciar hasta**: 3 veces
- **Detener la tarea si se ejecuta más de**: 10 minutos
- **Si la tarea en ejecución no finaliza cuando se solicita, forzar su detención**: ✓ Marcado

### Paso 8: Finalizar
1. Haz clic en **"Aceptar"**
2. Te pedirá las credenciales del usuario - introduce tu usuario y contraseña de Windows
3. La tarea se creará y aparecerá en la lista

## Verificación y Pruebas

### Probar la Tarea Manualmente
1. En el Programador de Tareas, busca tu tarea
2. Haz clic derecho sobre ella
3. Selecciona **"Ejecutar"**
4. Verifica que se ejecute correctamente

### Verificar los Archivos Generados
Después de la primera ejecución, deberías ver estos archivos en la carpeta:
- `appointments_data.json` - Datos para la app
- `sql_sync.log` - Log con detalles de la ejecución
- `sync_success.log` - Confirmación de éxito

### Monitorear la Tarea
1. En el Programador de Tareas, selecciona tu tarea
2. En la parte inferior verás el **"Historial"**
3. Aquí puedes ver todas las ejecuciones y si fueron exitosas

## Solución de Problemas

### Si la tarea no se ejecuta:
1. Verifica que el usuario tenga permisos para ejecutar scripts
2. Asegúrate de que Python esté instalado y en el PATH
3. Verifica que el archivo `sql_sync_script.py` exista en la ruta correcta

### Si hay errores de conexión SQL:
1. Verifica que el servidor SQL esté accesible: `GABINETE2\INFOMED`
2. Verifica que la base de datos `GELITE` exista
3. Asegúrate de que el usuario tenga permisos de lectura en la base de datos

### Si hay errores de permisos:
1. Ejecuta el Programador de Tareas como Administrador
2. Asegúrate de que la tarea esté configurada para "Ejecutar con los privilegios más altos"

### Archivos de Log para Diagnóstico:
- **sql_sync.log**: Log detallado de cada ejecución
- **sync_errors.log**: Solo errores
- **sync_success.log**: Solo ejecuciones exitosas

## Configuración de la App React Native

Para que la app lea los datos sincronizados, asegúrate de que el servicio `SQLServerService` en tu app esté configurado para leer el archivo `appointments_data.json` desde la ubicación correcta.

## Frecuencia de Sincronización

La tarea está configurada para ejecutarse cada 5 minutos. Si necesitas cambiar esta frecuencia:
1. Abre el Programador de Tareas
2. Haz doble clic en tu tarea
3. Ve a la pestaña "Desencadenadores"
4. Edita el desencadenador existente
5. Cambia el valor de "Repetir cada"

## Notas Importantes

- El script detecta automáticamente citas nuevas vs. actualizadas usando la lógica `FechaAlta == CitMod`
- Los datos se guardan en formato JSON compatible con React Native
- Se mantiene un historial de cambios para evitar procesamiento duplicado
- El sistema es tolerante a fallos y registra todos los errores

¡La sincronización automática ya está lista para funcionar!