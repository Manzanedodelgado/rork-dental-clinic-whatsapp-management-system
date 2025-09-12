# Configuración de Google Sheets

## Archivos creados

### 1. `constants/googleConfig.ts`
Archivo de configuración centralizada que contiene:
- **GOOGLE_CONFIG**: Objeto con las credenciales y configuración
  - `GOOGLE_SHEET_ID`: ID de tu Google Sheet
  - `GOOGLE_API_KEY`: Tu clave de API de Google
  - `SHEET_NAME`: Nombre de la hoja (por defecto "Hoja 1")
  - `SERVICE_ACCOUNT_FILE`: Archivo de service account (para uso futuro)

- **GOOGLE_SHEETS_URLS**: Funciones para generar URLs
  - `getApiUrl()`: URL para Google Sheets API v4
  - `getCsvUrl()`: URL para exportar como CSV
  - `getTestUrl()`: URL para probar la conexión

### 2. `services/googleSheetsTestService.ts`
Servicio de diagnóstico que incluye:
- **runDiagnostics()**: Ejecuta pruebas completas de configuración
- **quickTest()**: Prueba rápida de conexión y datos

## Configuración actual

```typescript
GOOGLE_SHEET_ID: '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ'
GOOGLE_API_KEY: 'AIzaSyA0c7nuWYhCyuiT8F2dBI_v-oqyjoutQ4A'
SHEET_NAME: 'Hoja 1'
```

## Cómo usar

### Importar la configuración:
```typescript
import { GOOGLE_CONFIG, GOOGLE_SHEETS_URLS } from '@/constants/googleConfig';
```

### Ejecutar diagnósticos:
```typescript
import { GoogleSheetsTestService } from '@/services/googleSheetsTestService';

// Diagnóstico completo
await GoogleSheetsTestService.runDiagnostics();

// Prueba rápida
const isWorking = await GoogleSheetsTestService.quickTest();
```

## Verificación automática

El servicio de prueba se ejecuta automáticamente en modo desarrollo (`__DEV__`) para verificar la configuración al iniciar la app.

## Próximos pasos

1. ✅ Configuración creada
2. ✅ Servicio actualizado para usar la configuración
3. ✅ Servicio de diagnóstico creado
4. 🔄 Verificar que los datos se cargan correctamente
5. 🔄 Solucionar el problema de fechas en la agenda

## Troubleshooting

Si ves errores:
1. Verifica que el Google Sheet sea público o que la API key tenga permisos
2. Comprueba que el nombre de la hoja sea correcto ("Hoja 1")
3. Revisa la consola para ver los logs de diagnóstico
4. Usa `GoogleSheetsTestService.runDiagnostics()` para obtener información detallada