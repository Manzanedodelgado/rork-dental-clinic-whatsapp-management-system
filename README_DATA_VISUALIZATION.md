# Aplicación de Visualización de Datos para Clínica Dental

Esta aplicación proporciona un panel de control completo para visualizar y analizar los datos de la clínica dental, incluyendo citas, pacientes y estadísticas de sincronización.

## Características

### Panel de Resumen
- Visualización de estadísticas clave (pacientes, citas, citas del día)
- Gráficos de barras para distribución de citas por día de la semana
- Gráfico circular para distribución por tipo de tratamiento
- Gráfico de barras para citas por dentista

### Estadísticas de Citas
- Resumen de citas (total, hoy, nuevas, actualizadas)
- Distribución por estado (programadas, completadas, canceladas, no asistidas)
- Análisis por franja horaria
- Distribución mensual

### Estadísticas de Pacientes
- Resumen de pacientes (total, con citas próximas, visitas recientes)
- Distribución por número de citas
- Tratamientos más comunes
- Estadísticas de retención

### Estado de Sincronización
- Monitoreo de la conexión con SQL Server
- Estadísticas de sincronización
- Historial de sincronización
- Funcionalidad para sincronización manual

## Componentes

La aplicación está organizada en los siguientes componentes:

1. **Dashboard**: Componente principal que integra todas las visualizaciones
2. **DataVisualization**: Gráficos y visualizaciones generales
3. **AppointmentStats**: Estadísticas detalladas de citas
4. **PatientStats**: Estadísticas detalladas de pacientes
5. **SyncStatus**: Estado y estadísticas de sincronización

## Uso

La aplicación utiliza los datos almacenados en el contexto de la clínica (`useClinicStore`), que se sincroniza con SQL Server. Los datos se actualizan automáticamente cuando cambia la fuente de datos.

## Tecnologías Utilizadas

- React Native con TypeScript
- Expo Router para navegación
- React Query para gestión de estado del servidor
- AsyncStorage para almacenamiento local
- Lucide React Native para iconos

## Integración con SQL Server

La aplicación se integra con SQL Server a través del servicio `SQLServerService`, que proporciona métodos para:

- Obtener citas y pacientes
- Sincronizar datos
- Verificar el estado de la conexión
- Obtener estadísticas de sincronización

## Mejoras Futuras

- Implementar gráficos más avanzados con bibliotecas como Victory Native
- Añadir filtros personalizables para las visualizaciones
- Implementar exportación de datos y reportes
- Añadir análisis predictivo para tendencias de citas