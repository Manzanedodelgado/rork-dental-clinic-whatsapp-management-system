# Implementación de Conexión SQL Server

Este documento explica cómo implementar la conexión directa con SQL Server para reemplazar Google Sheets.

## Arquitectura Actual

La aplicación ahora utiliza `SQLServerService` que:

1. **Detecta citas nuevas**: Cuando `FechaAlta === CitMod`
2. **Detecta citas modificadas**: Cuando `FechaAlta !== CitMod`
3. **Sincroniza cada 5 minutos** automáticamente
4. **Mantiene caché local** para comparar cambios
5. **Muestra estadísticas** de sincronización en el dashboard

## Implementación de Producción

### 1. Backend API (Requerido)

Necesitas crear un backend que ejecute la consulta SQL y exponga una API REST:

```typescript
// Ejemplo de endpoint backend
POST /api/appointments/sync
Response: {
  appointments: SQLServerAppointment[],
  timestamp: string
}
```

### 2. Configuración SQL Server

El servicio está preparado para usar tu consulta SQL exacta:

```sql
SELECT TOP 100
[IdCita] AS Registro,
[HorSitCita] AS CitMod,
FecAlta AS FechaAlta,
[NUMPAC] AS NumPac,
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
NOTAS AS Notas
FROM dbo.DCitas
ORDER BY HorSitCita DESC;
```

### 3. Actualizar SQLServerService

Modifica el método `executeSQLQuery()` en `services/sqlServerService.ts`:

```typescript
private static async executeSQLQuery(): Promise<SQLServerAppointment[]> {
  try {
    const response = await fetch('/api/appointments/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.appointments;
  } catch (error) {
    console.error('SQL Server query failed:', error);
    throw error;
  }
}
```

### 4. Configuración de Conexión

Configura los parámetros de tu SQL Server:

```typescript
// En tu app, configura la conexión
SQLServerService.configure({
  server: 'tu-servidor-sql',
  database: 'tu-base-datos',
  apiEndpoint: '/api/appointments/sync'
});
```

## Funcionalidades Implementadas

### ✅ Detección de Cambios
- **Citas nuevas**: `FechaAlta === CitMod`
- **Citas modificadas**: `FechaAlta !== CitMod`
- **Comparación de campos**: Fecha, Hora, Estado, Tratamiento, etc.

### ✅ Sincronización Automática
- **Intervalo**: Cada 5 minutos
- **Retry**: 3 intentos con backoff exponencial
- **Background**: Continúa en segundo plano

### ✅ Dashboard Integrado
- **Estado de conexión**: SQL Server + indicador visual
- **Estadísticas**: Total de registros, citas nuevas/actualizadas
- **Última sincronización**: Timestamp de la última sync
- **Errores**: Mensajes de error visibles

### ✅ Mapeo de Datos
- **Estados**: Planificada → scheduled, Finalizada → completed, etc.
- **Tratamientos**: Mapeo completo de IdIcono a nombres
- **Odontólogos**: Mapeo de IdUsu a nombres completos
- **Fechas/Horas**: Conversión a formato estándar

## Próximos Pasos

1. **Crear backend API** que ejecute la consulta SQL
2. **Configurar autenticación** para la API
3. **Implementar logging** para auditoría
4. **Añadir notificaciones** para citas nuevas/modificadas
5. **Optimizar consultas** para mejor rendimiento

## Ventajas vs Google Sheets

- ✅ **Tiempo real**: Sincronización directa con tu base de datos
- ✅ **Seguridad**: No dependes de servicios externos
- ✅ **Rendimiento**: Consultas SQL optimizadas
- ✅ **Detección de cambios**: Lógica inteligente para nuevas/modificadas
- ✅ **Escalabilidad**: Maneja grandes volúmenes de datos
- ✅ **Integridad**: Datos siempre consistentes con tu sistema

La aplicación está lista para funcionar con SQL Server. Solo necesitas implementar el backend API que ejecute las consultas.