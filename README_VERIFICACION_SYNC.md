# 📋 Guía de Verificación de Sincronización SQL Server

## 🔍 Cómo Comprobar que la Sincronización Funciona

### 1. **Verificación Visual en la App**

#### En la Pantalla de Inicio (Dashboard):
- **Estado de Conexión**: Verifica el icono junto a "SQL Server"
  - ✅ **CheckCircle verde**: Conectado correctamente
  - ❌ **AlertCircle rojo**: Error de conexión

- **Información de Sincronización**:
  - **Total registros**: Número de citas sincronizadas
  - **Última sincronización**: Hora de la última actualización
  - **Cambios detectados**: Citas nuevas y actualizadas

#### Botones de Acción:
- **🔄 Botón Sincronizar**: Fuerza una sincronización manual
- **⚡ Botón Verificar**: Ejecuta diagnóstico completo

### 2. **Verificación Detallada**

#### Paso 1: Presiona el botón "Verificar" (⚡)
Esto ejecutará un diagnóstico completo que te mostrará:
```
📊 Total citas: X
🆕 Citas nuevas: X
🔄 Citas actualizadas: X
⏰ Última sync: [fecha y hora]
🔗 Estado: connected/disconnected
```

#### Paso 2: Revisa la Consola del Navegador
Abre las herramientas de desarrollador (F12) y busca estos mensajes:
```
🔄 Ejecutando consulta SQL simulada...
📊 Servidor: GABINETE2\INFOMED
🗄️ Base de datos: GELITE
✅ Consulta completada: X registros encontrados
```

### 3. **Verificación en la Agenda**

#### Ve a la pestaña "Agenda":
- Las citas sincronizadas aparecerán en el calendario
- Verifica que las fechas coincidan con tu base de datos
- Comprueba que los datos del paciente sean correctos

#### Indicadores de Sincronización:
- **Estado de conexión** en la parte superior
- **Última sincronización** mostrada
- **Errores de sync** si los hay

### 4. **Lógica de Detección de Cambios**

La app distingue entre:

#### 🆕 **Citas Nuevas**:
- `FechaAlta === CitMod` (misma fecha y hora)
- Aparecen como "nuevas" en el dashboard

#### 🔄 **Citas Actualizadas**:
- `FechaAlta !== CitMod` (fechas diferentes)
- Se detectan cambios en campos clave
- Aparecen como "actualizadas" en el dashboard

### 5. **Frecuencia de Sincronización**

- **Automática**: Cada 5 minutos
- **Manual**: Botón de sincronizar
- **Al iniciar**: Cuando abres la app

### 6. **Solución de Problemas**

#### Si no ves datos:
1. Presiona el botón "Verificar" para diagnóstico
2. Revisa la consola del navegador
3. Presiona "Sincronizar Ahora" manualmente
4. Verifica que el script de Python esté ejecutándose

#### Si hay errores:
- Los errores aparecen en rojo en el dashboard
- Revisa la consola para detalles técnicos
- Usa el botón "Reintentar" si aparece

### 7. **Datos de Prueba Actuales**

La app actualmente usa datos simulados que incluyen:

```sql
-- Cita Nueva (FechaAlta = CitMod)
Registro: 1001
Paciente: María García López
Fecha: 2025-01-15, Hora: 09:00
Tratamiento: Revision
Dr: Mario Rubio

-- Cita Actualizada (FechaAlta ≠ CitMod)
Registro: 1002
Paciente: Carlos Ruiz Martín
Fecha: 2025-01-16, Hora: 10:30
Tratamiento: Ortodoncia
Dra: Irene Garcia

-- Cita Nueva
Registro: 1003
Paciente: Ana Martín Sánchez
Fecha: 2025-01-17, Hora: 11:00
Tratamiento: Higiene dental
Dra: Virginia Tresgallo
```

### 8. **Próximos Pasos para Conexión Real**

Para conectar con tu SQL Server real:

1. **Crear Backend API** que ejecute la consulta SQL
2. **Modificar `executeSQLQuery()`** para llamar a tu API
3. **Configurar CORS** en tu servidor
4. **Actualizar la URL** del endpoint

### 9. **Comandos de Verificación Rápida**

```javascript
// En la consola del navegador:

// Verificar estado
SQLServerService.verifySyncStatus().then(console.log)

// Ver estadísticas
SQLServerService.getSyncStats()

// Limpiar caché (para testing)
SQLServerService.clearCache()

// Probar conexión
SQLServerService.testConnection().then(console.log)
```

### 10. **Indicadores Visuales de Funcionamiento**

✅ **Todo funciona si ves**:
- Icono verde de conexión
- Número de registros > 0
- Hora de última sincronización reciente
- Citas aparecen en la agenda
- No hay mensajes de error

❌ **Hay problemas si ves**:
- Icono rojo de error
- Mensajes de error en rojo
- "0 registros" persistente
- Agenda vacía
- "Nunca" en última sincronización

---

## 🚀 Resumen de Verificación

1. **Abre la app** → Ve al Dashboard
2. **Presiona "Verificar"** → Revisa el diagnóstico
3. **Ve a "Agenda"** → Confirma que aparecen las citas
4. **Revisa la consola** → Busca mensajes de éxito
5. **Prueba sincronización manual** → Botón "Sincronizar"

¡La sincronización está funcionando correctamente cuando todos estos pasos muestran datos y estados positivos! 🎉