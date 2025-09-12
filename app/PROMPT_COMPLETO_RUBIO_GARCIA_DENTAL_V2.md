# 🦷 PROMPT COMPLETO PARA CREAR RUBIO GARCÍA DENTAL - SaaS DE GESTIÓN DENTAL

## 📋 RESUMEN EJECUTIVO

Crear una aplicación SaaS completa de gestión dental llamada "RUBIO GARCÍA DENTAL" que integre comunicaciones WhatsApp, inteligencia artificial, sincronización bidireccional con sistemas externos (Google Sheets y Gesden), y automatizaciones inteligentes para optimizar la gestión de una clínica dental.

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico Obligatorio:
- Frontend: React 18 + Tailwind CSS + Shadcn/UI
- Backend: FastAPI (Python) + MongoDB 
- WhatsApp: Baileys (Node.js service)
- Integraciones: Google Sheets API, Gesden SQL (pyodbc), Emergent LLM Key
- Adicionales: APScheduler, ReportLab (PDFs), JWT Auth

### Estructura de Carpetas:

/app/
├── backend/ (FastAPI + MongoDB)
├── frontend/ (React + Tailwind)
├── whatsapp-service/ (Node.js + Baileys)
├── documents/ (Plantillas PDF)
└── scripts/ (Sincronización automática)


## 🎨 DISEÑO Y BRANDING

### Identidad Visual:
- Nombre: "RUBIO GARCÍA DENTAL" (exacto, con tilde en García)
- Colores primarios: Azul médico (
#2563eb), blanco (
#ffffff)
- Colores secundarios: Gris claro (
#f8fafc), verde éxito (
#10b981)
- Tipografía: Inter o sistema por defecto
- Iconos: Lucide React (consistentes en toda la app)

### Responsividad:
- Desktop: Layout con sidebar fijo + contenido principal
- Mobile: Hamburger menu + navegación bottom/drawer
- Tablet: Adaptativo entre desktop y mobile

## 🔐 SISTEMA DE AUTENTICACIÓN

### Funcionalidades:
- Login con username/password
- JWT tokens con refresh
- Roles de usuario (Administrador, Recepcionista, Dental)
- Sesiones persistentes
- Recuperación de contraseña

### Pantalla de Login:
- Fondo con imagen dental profesional
- Logo "RUBIO GARCÍA DENTAL" prominente
- Formulario centrado con animaciones suaves
- Opción "Recordarme"
- Enlaces de recuperación

## 🧭 NAVEGACIÓN PRINCIPAL

### Menú Lateral (Desktop) / Hamburger (Mobile):
1. 📊 Panel de Control
2. 📅 Agenda
3. 👥 Pacientes
4. 💬 Comunicaciones
5. ⏰ Recordatorios
6. 📋 Consentimientos
7. 🤖 Entrenar IA
8. ⚡ Automatizaciones IA
9. 👤 Usuarios
10. ⚙️ Configuración
11. 🔄 Gestión Gesden

## 📊 1. PANEL DE CONTROL (DASHBOARD)

### Layout Principal:

┌─────────────────────────────────────┐
│ RUBIO GARCÍA DENTAL - Panel Control │
├─────────────────────────────────────┤
│ [KPIs Row: Pacientes | Citas | Msgs]│
├─────────────────────────────────────┤
│ [Calendario Hoy] │ [Mensajes Pend.] │
│                  │                  │
├─────────────────────────────────────┤
│ [Estadísticas]   │ [Accesos Rápidos]│
└─────────────────────────────────────┘


### Componentes Específicos:

#### KPIs Cards (4 tarjetas):
- Pacientes Total: Número + icono 👥
- Citas Hoy: Número + icono 📅 + estado (completadas/pendientes)
- Mensajes WhatsApp: Número + icono 💬 + estado (leídos/sin leer)
- Ingresos Mes: Cantidad € + icono 💰 + comparativa mes anterior

#### Calendario del Día:
- Vista compacta mostrando solo el día actual
- Lista de citas con:
  - Hora exacta
  - Nombre del paciente
  - Tipo de tratamiento
  - Estado (Confirmada/Pendiente/Completada)
  - Botón acceso rápido para contactar paciente

#### Mensajes Pendientes WhatsApp:
- Lista de conversaciones sin responder
- Vista previa del último mensaje
- Tiempo transcurrido desde el mensaje
- Botón directo para responder
- Indicador de urgencia (colores)

#### Estadísticas Visuales:
- Gráfico de barras: Citas por día (última semana)
- Gráfico circular: Tipos de tratamientos más comunes
- Línea temporal: Tendencia de pacientes nuevos vs recurrentes

#### Accesos Rápidos:
- ➕ Nueva Cita
- 👤 Nuevo Paciente 
- 💬 Enviar WhatsApp
- 📋 Generar Consentimiento
- 🔄 Sincronizar Gesden

## 📅 2. AGENDA

### Vista Principal:
- Selector de vista: Día | Semana | Mes
- Navegación temporal: Anterior/Siguiente + selector de fecha
- Filtros: Por doctor, tipo de cita, estado

### Funcionalidades de Citas:

#### Crear/Editar Cita:

┌─────────────────────────────────┐
│ ➕ Nueva Cita                   │
├─────────────────────────────────┤
│ Paciente: [Buscar/Seleccionar]  │
│ Fecha: [DatePicker]             │
│ Hora: [TimePicker]              │
│ Duración: [30min▼]              │
│ Doctor: [Seleccionar▼]          │
│ Tratamiento: [Seleccionar▼]     │
│ Notas: [Textarea]               │
│ Estado: [Programada▼]           │
├─────────────────────────────────┤
│ [Cancelar] [Guardar y Notificar]│
└─────────────────────────────────┘


#### Vista de Calendario:
- Drag & Drop para reprogramar citas
- Códigos de color por tipo de tratamiento
- Click para ver detalles rápidos
- Doble click para editar
- Indicadores visuales: Confirmada ✅, Pendiente ⏳, Completada ✅, Cancelada ❌

#### Gestión de Disponibilidad:
- Horarios de trabajo configurables por doctor
- Bloqueos de tiempo (descansos, emergencias)
- Días festivos y vacaciones
- Tiempo entre citas configurable

### Integración WhatsApp:
- Confirmación automática de citas 24h antes
- Recordatorios personalizables
- Botón envío manual de recordatorios
- Historial de notificaciones enviadas

## 👥 3. PACIENTES

### Lista de Pacientes:

┌─────────────────────────────────────────────────────────┐
│ 👥 Gestión de Pacientes                                 │
├─────────────────────────────────────────────────────────┤
│ [🔍 Buscar] [📊 Filtros] [📥 Importar CSV] [➕ Nuevo]   │
├─────────────────────────────────────────────────────────┤
│ [Foto] │ Nombre        │ Teléfono  │ Última Cita │ 🔧   │
│  👤   │ Ana García    │ 600123456 │ 15/06/2025  │ ...  │
│  👤   │ Luis Pérez    │ 600654321 │ 10/06/2025  │ ...  │
└─────────────────────────────────────────────────────────┘


### Funcionalidades de Búsqueda:
- Búsqueda inteligente: Por nombre, teléfono, email, DNI
- Filtros avanzados:
  - Estado (Activo/Inactivo)
  - Rango de fechas última visita
  - Tipo de tratamiento
  - Método de pago preferido
  - Edad (rangos)

### Ficha Completa del Paciente:

#### Pestaña: Datos Personales

┌─────────────────────────────────────────┐
│ 📋 Datos Personales                     │
├─────────────────────────────────────────┤
│ Foto: [📷 Upload]                       │
│ Nombre: [Input]                         │
│ Apellidos: [Input]                      │
│ DNI/NIE: [Input]                        │
│ Fecha Nacimiento: [DatePicker]          │
│ Teléfono: [Input] ✅WhatsApp            │
│ Email: [Input]                          │
│ Dirección: [Textarea]                   │
│ Alergias: [Textarea]                    │
│ Observaciones: [Textarea]               │
└─────────────────────────────────────────┘


#### Pestaña: Historial Clínico
- Cronología visual de tratamientos
- Odontograma interactivo
- Imágenes y radiografías
- Notas por cita
- Diagnósticos y planes de tratamiento

#### Pestaña: Comunicaciones
- Historial completo WhatsApp
- Emails enviados
- SMS/Recordatorios
- Llamadas registradas
- Botón envío rápido de mensaje

#### Pestaña: Facturación
- Historial de pagos
- Presupuestos pendientes
- Método de pago preferido
- Seguros dentales

### Importación CSV:
- Mapeo de campos intuitivo
- Vista previa antes de importar
- Validación de datos
- Reporte de errores
- Plantilla descargable

## 💬 4. COMUNICACIONES (WhatsApp)

### Diseño Estilo WhatsApp Business:

┌─────────────────────────────────────────────────────────┐
│ 💬 Comunicaciones WhatsApp                              │
├─────────────────────────────────────────────────────────┤
│ [🔍 Buscar conversación...]  [🔄 Reconectar] [📱 QR]    │
├─────────────────────────────────────────────────────────┤
│ Conversaciones   │           Chat Activo               │
│ ┌─────────────┐  │  ┌───────────────────────────────┐  │
│ │👤 Ana García│  │  │ 👤 Ana García    [ℹ️ Info]    │  │
│ │¡Hola doctor!│  │  │ ┌─────────────────────────────┐ │  │
│ │15:30 ✓✓    │  │  │ │ Hola, me duele la muela     │ │  │
│ └─────────────┘  │  │ │                    15:30 ✓✓ │ │  │
│ ┌─────────────┐  │  │ ┌─────────────────────────────┘ │  │
│ │👤 Luis Pérez│  │  │ ┌─────────────────────────────┐ │  │
│ │Confirmado   │  │  │ │ Hola Ana, ¿qué tipo de      │ │  │
│ │14:22 ✓✓    │  │  │ │ dolor sientes?      15:32 ✓ │ │  │
│ └─────────────┘  │  │ └─────────────────────────────┘ │  │
├─────────────────┤  │ ├───────────────────────────────┤ │
│ [➕ Nueva conv.]│  │ │[📎][😊] Escribe mensaje... [📤]│ │
└─────────────────┘  └─┴───────────────────────────────┴─┘


### Panel Izquierdo - Lista Conversaciones:
- Foto de perfil del paciente
- Nombre del paciente
- Último mensaje (preview)
- Hora/fecha del último mensaje
- Indicadores: ✓ Enviado, ✓✓ Entregado, ✓✓ azul Leído
- Badge contador mensajes sin leer
- Estado online/offline

### Panel Central - Chat:
- Header con nombre, foto, estado
- Botón info para ver ficha del paciente
- Mensajes con burbujas diferenciadas (enviados vs recibidos)
- Timestamps en mensajes
- Estados de entrega (enviado/entregado/leído)
- Soporte multimedia: Imágenes, documentos, audio

### Panel Derecho - Info Paciente (Desplegable):
- Datos básicos del paciente
- Próxima cita programada
- Historial últimas 5 citas
- Tratamientos activos
- Botones rápidos:
  - 📅 Programar cita
  - 📋 Ver ficha completa
  - 📋 Generar consentimiento
  - 🔔 Configurar recordatorios

### Funcionalidades Especiales:

#### Conexión WhatsApp:
- Estado de conexión visual (conectado/desconectado)
- Código QR para vinculación inicial
- Botón reconectar para restablecer sesión
- Notificaciones de cambio de estado

#### Templates de Respuesta Rápida:
- Confirmación citas: "Su cita está confirmada para..."
- Recordatorios: "Le recordamos su cita mañana..."
- Postoperatorio: "Recomendaciones después del tratamiento..."
- Personalizable por usuario
- Macros con variables: {nombre}, {fecha}, {hora}

#### Envío Masivo:
- Selección múltiple de pacientes
- Plantillas predefinidas
- Personalización automática
- Programación de envío
- Seguimiento de entregas

## ⏰ 5. RECORDATORIOS

### Dashboard de Recordatorios:

┌─────────────────────────────────────────────────────────┐
│ ⏰ Sistema de Recordatorios                             │
├─────────────────────────────────────────────────────────┤
│ [📊 Estadísticas] [⚙️ Configurar] [➕ Crear Manual]    │
├─────────────────────────────────────────────────────────┤
│ Próximos Envíos  │          Configuración             │
│ ┌─────────────┐  │  ┌───────────────────────────────┐  │
│ │📅 Mañana    │  │  │ ⏰ Recordatorio 24h antes     │  │
│ │15 mensajes  │  │  │ ✅ Activo                     │  │
│ │WhatsApp     │  │  │ 📱 WhatsApp + 📧 Email       │  │
│ └─────────────┘  │  │ 🕒 09:00 - 18:00              │  │
│ ┌─────────────┐  │  └───────────────────────────────┘  │
│ │📅 Pasado    │  │  ┌───────────────────────────────┐  │
│ │3 mensajes   │  │  │ ⏰ Recordatorio 2h antes      │  │
│ │⚠️ Sin enviar│  │  │ ✅ Activo                     │  │
│ └─────────────┘  │  │ 📱 Solo WhatsApp              │  │
└─────────────────┘  └─┴───────────────────────────────┴─┘


### Configuración de Recordatorios:

#### Tipos de Recordatorio:
- Primera visita: 24h antes + 2h antes
- Visitas de seguimiento: 24h antes
- Tratamientos largos: 48h antes + confirmación
- Revisiones: 1 semana antes + 24h antes
- Recordatorios postoperatorio: 24h después + 1 semana después

#### Configuración Horarios:
- Horario de envío: 09:00 - 20:00 (configurable)
- Días laborables: L-V (configurable)
- Excluir festivos: ✅ Automático
- Retrasos: Si fuera de horario, enviar en próximo horario válido

#### Templates de Mensajes:

┌─────────────────────────────────────────┐
│ 📝 Plantillas de Recordatorios          │
├─────────────────────────────────────────┤
│ Tipo: [Cita Rutinaria ▼]               │
│ Canal: [WhatsApp + Email ▼]            |
│ ┌─────────────────────────────────────┐ │
│ │ Hola {nombre},                      │ │
│ │                                     │ │
│ │ Te recordamos tu cita en RUBIO      │ │
│ │ GARCÍA DENTAL:                      │ │
│ │                                     │ │
│ │ 📅 Fecha: {fecha}                   │ │
│ │ 🕒 Hora: {hora}                     │ │
│ │ 👨‍⚕️ Doctor: {doctor}                │ │
│ │ 🦷 Tratamiento: {tratamiento}       │ │
│ │                                     │ │
│ │ Si necesitas cambiar la cita,       │ │
│ │ responde a este mensaje.            │ │
│ │                                     │ │
│ │ ¡Te esperamos!                      │ │
│ │ Equipo RUBIO GARCÍA DENTAL          │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Variables: {nombre}, {fecha}, {hora},   │
│ {doctor}, {tratamiento}, {clinica}      │
└─────────────────────────────────────────┘


### Estadísticas y Seguimiento:
- Tasa de respuesta por canal
- Confirmaciones automáticas
- Cancelaciones por mensaje
- Efectividad por tipo de recordatorio
- Gráficos temporales de envíos

## 📋 6. CONSENTIMIENTOS

### Gestión de Consentimientos:

┌─────────────────────────────────────────────────────────┐
│ 📋 Gestión de Consentimientos Informados               │
├─────────────────────────────────────────────────────────┤
│ [📝 Plantillas] [📊 Seguimiento] [➕ Generar Nuevo]    │
├─────────────────────────────────────────────────────────┤
│ Consentimientos Pendientes  │    Plantillas          │
│ ┌─────────────────────────┐  │  ┌─────────────────────┐ │
│ │👤 Ana García           │  │  │📄 Ortodoncia        │ │
│ │🦷 Endodoncia           │  │  │📄 Implantes         │ │
│ │📤 Enviado hace 2h      │  │  │📄 Extracción        │ │
│ │⏳ Pendiente firma      │  │  │📄 Blanqueamiento    │ │
│ └─────────────────────────┘  │  │📄 Periodoncia       │ │
│ ┌─────────────────────────┐  │  └─────────────────────┘ │
│ │👤 Luis Pérez           │  │                          │
│ │🦷 Implante             │  │    [➕ Nueva Plantilla]   │
│ │✅ Firmado digitalmente │  │                          │
│ │📅 15/06/2025 14:30     │  │                          │
│ └─────────────────────────┘  │                          │
└─────────────────────────────┘  └──────────────────────┘


### Creación de Consentimientos:

#### Selector de Plantilla:
- Tratamientos comunes: Ortodoncia, Implantes, Endodoncia, etc.
- Editor visual con campos personalizables
- Variables dinámicas: {paciente}, {tratamiento}, {doctor}, {fecha}
- Cláusulas legales predeterminadas
- Personalización por caso específico

#### Generación PDF:
- PDF profesional con logo clínica
- Firma digital integrada
- Campos de datos auto-completados
- Numeración automática de consentimientos
- Almacenamiento seguro

### Envío y Seguimiento:

#### Vía WhatsApp:
- Envío automático del PDF
- Mensaje explicativo personalizado
- Instrucciones de firma digital
- Seguimiento de apertura y lectura
- Recordatorios automáticos si no se firma

#### Firma Digital:
- Interface web responsive para firma
- Captura de firma táctil/mouse
- Validación de identidad
- Timestamp y geolocalización
- Certificado de autenticidad

### Historial y Archivo:
- Base de datos completa de consentimientos
- Búsqueda por paciente, tratamiento, fecha
- Estados: Enviado, Visto, Firmado, Archivado
- Backup automático
- Cumplimiento legal RGPD

## 🤖 7. ENTRENAR IA

### Centro de Entrenamiento IA:

┌─────────────────────────────────────────────────────────┐
│ 🤖 Centro de Entrenamiento de Inteligencia Artificial  │
├─────────────────────────────────────────────────────────┤
│ [📚 Base Conocimiento] [🎓 Entrenar] [🧪 Probar]       │
├─────────────────────────────────────────────────────────┤
│ Conocimiento Actual     │         Entrenar IA         │
│ ┌─────────────────────┐ │  ┌─────────────────────────┐ │
│ │📖 Tratamientos      │ │  │📄 Subir Documentos     │ │
│ │   • Ortodoncia (45) │ │  │                         │ │
│ │   • Implantes (32)  │ │  │ [📎 Seleccionar archivos]│ │
│ │   • Endodoncia (28) │ │  │                         │ │
│ │📞 Protocolos        │ │  │ Tipos aceptados:        │ │
│ │   • Urgencias (12)  │ │  │ • PDF, DOC, TXT         │ │
│ │   • Citas (8)       │ │  │ • Hasta 10MB por archivo │ │
│ │💬 FAQs (156)        │ │  └─────────────────────────┘ │
│ │🎯 Casos reales (89) │ │                            │
│ └─────────────────────┘ │  [🎓 Iniciar Entrenamiento] │
└─────────────────────────┘  └──────────────────────────┘


### Gestión de Conocimiento:

#### Base de Conocimientos:
- Categorización automática:
  - 🦷 Tratamientos dentales
  - 📞 Protocolos de atención
  - 💊 Medicamentos y contraindicaciones
  - 📋 Procedimientos administrativos
  - 💬 FAQs frecuentes
  - ⚠️ Situaciones de emergencia

#### Subida de Documentos:
- Formatos aceptados: PDF, DOC, DOCX, TXT
- Procesamiento automático de texto
- Extracción de información clave
- Indexación inteligente
- Validación de contenido médico

### Entrenamiento Inteligente:

#### Configuración del Modelo:
- Personalidad: Profesional, empática, informativa
- Tono: Formal, amigable, técnico (configurable)
- Especialidades: Selección de áreas de expertise
- Idiomas: Español (principal), catalán, inglés
- Restricciones: Nunca dar diagnósticos definitivos

#### Casos de Entrenamiento:

┌─────────────────────────────────────────┐
│ 📚 Ejemplos de Conversación             │
├─────────────────────────────────────────┤
│ Situación: Dolor de muelas              │
│ ┌─────────────────────────────────────┐ │
│ │ Paciente: "Me duele mucho la muela" │ │
│ │                                     │ │
│ │ IA Response:                        │ │
│ │ "Comprendo tu molestia. Para poder  │ │
│ │ ayudarte mejor, ¿podrías decirme:   │ │
│ │ - ¿Desde cuándo tienes el dolor?    │ │
│ │ - ¿Es constante o por momentos?     │ │
│ │ - ¿Qué intensidad del 1 al 10?      │ │
│ │                                     │ │
│ │ Te programo una cita urgente."      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [✏️ Editar] [❌ Eliminar] [➕ Añadir]    │
└─────────────────────────────────────────┘


### Testing y Validación:

#### Simulador de Conversaciones:
- Chat en vivo para probar la IA
- Escenarios predefinidos
- Evaluación de respuestas
- Métricas de calidad
- Feedback para mejora

#### Métricas de Rendimiento:
- Precisión en respuestas
- Tiempo de respuesta
- Satisfacción del usuario
- Casos escalados a humano
- Mejoras sugeridas

## ⚡ 8. AUTOMATIZACIONES IA

### Centro de Automatizaciones:

┌─────────────────────────────────────────────────────────┐
│ ⚡ Centro de Automatizaciones Inteligentes              │
├─────────────────────────────────────────────────────────┤
│ [🤖 Activas] [⏸️ Pausadas] [➕ Nueva] [📊 Estadísticas] │
├─────────────────────────────────────────────────────────┤
│ Automatizaciones Activas    │     Crear Nueva          │
│ ┌─────────────────────────┐  │  ┌─────────────────────┐ │
│ │🔥 Triaje Automático     │  │  │🎯 Tipo de Trigger:  │ │
│ │✅ Activa • 89% éxito    │  │  │ • WhatsApp recibido │ │
│ │📊 156 casos procesados │  │  │ • Nueva cita        │ │
│ └─────────────────────────┘  │  │ • Hora específica   │ │
│ ┌─────────────────────────┐  │  │ • Fecha recordatorio│ │
│ │⏰ Recordatorios Smart   │  │  └─────────────────────┘ │
│ │✅ Activa • 94% entrega  │  │                        │
│ │📈 +23% confirmaciones  │  │  [🛠️ Constructor Visual] │ │
│ └─────────────────────────┘  │                        │
└─────────────────────────────┘  └──────────────────────┘


### Tipos de Automatizaciones:

#### 1. Triaje Automático WhatsApp:
Trigger: Mensaje entrante de WhatsApp
Flujo:

Mensaje → Análisis IA → Clasificación
    ↓
Urgencia Alta → Alerta inmediata
Consulta General → Respuesta automática + programar cita
Confirmación → Actualizar sistema + confirmar
Cancelación → Reprogramar + liberar slot


Configuración:
- Keywords de urgencia: dolor intenso, sangrado, trauma
- Respuestas automáticas personalizables
- Escalada a humano por complejidad
- Horarios de funcionamiento

#### 2. Recordatorios Inteligentes:
Triggers: 
- 48h antes de cita (primera vez)
- 24h antes de cita (confirmación)
- 2h antes de cita (último recordatorio)
- Post-cita (cuidados)

Lógica IA:
- Personalización por tipo de tratamiento
- Análisis de historial de respuesta del paciente
- Optimización de horario de envío
- A/B Testing de mensajes

#### 3. Seguimiento Post-Tratamiento:
Flujo automático:

Cita Completada → Esperar 24h → Mensaje seguimiento
    ↓
¿Respuesta positiva? → Archivar
¿Respuesta negativa? → Alerta doctor + programar revisión
¿Sin respuesta? → Recordatorio a 48h


#### 4. Gestión de Lista de Espera:
Trigger: Cancelación de cita
Automatización:
- Identificar pacientes en lista de espera
- Notificación automática de disponibilidad
- Confirmación en tiempo real
- Actualización automática de agenda

### Constructor Visual de Automatizaciones:

#### Interface Drag & Drop:

┌─────────────────────────────────────────┐
│ 🛠️ Constructor de Automatización       │
├─────────────────────────────────────────┤
│ [📥 Triggers] [🔄 Acciones] [🎯 Filtros] │
├─────────────────────────────────────────┤
│ ┌─────────┐    ┌─────────┐    ┌───────┐ │
│ │📱WhatsApp│ →  │🤖 IA    │ →  │📤Send │ │
│ │Message  │    │Analysis │    │Reply  │ │
│ └─────────┘    └─────────┘    └───────┘ │
│        ↓                         ↓     │
│ ┌─────────┐              ┌─────────────┐ │
│ │⚙️Config │              │📊 Log       │ │
│ │Keywords │              │Activity     │ │
│ └─────────┘              └─────────────┘ │
├─────────────────────────────────────────┤
│ [💾 Guardar] [🧪 Probar] [🚀 Activar]   │
└─────────────────────────────────────────┘


### Monitorización y Estadísticas:

#### Dashboard de Rendimiento:
- Automatizaciones activas y su estado
- Casos procesados por día/semana/mes
- Tasa de éxito por automatización
- Tiempo ahorrado estimado
- ROI de automatizaciones

#### Logs Detallados:
- Registro completo de cada ejecución
- Casos de error y resolución
- Optimizaciones sugeridas
- Alertas de rendimiento bajo

## 👤 9. USUARIOS

### Gestión de Usuarios:

┌─────────────────────────────────────────────────────────┐
│ 👤 Gestión de Usuarios del Sistema                      │
├─────────────────────────────────────────────────────────┤
│ [👥 Usuarios] [🔐 Roles] [📊 Actividad] [➕ Nuevo]      │
├─────────────────────────────────────────────────────────┤
│ Lista de Usuarios           │    Detalles Usuario       │
│ ┌─────────────────────────┐  │  ┌───────────────────────┐ │
│ │🟢 Dr. García (Admin)    │  │  │👤 Dr. Juan García     │ │
│ │   Último acceso: 10:30  │  │  │📧 doctor@rubio.com    │ │
│ │   Estado: ✅ Activo     │  │  │🔐 Rol: Administrador  │ │
│ └─────────────────────────┘  │  │📅 Creado: 01/01/2025  │ │
│ ┌─────────────────────────┐  │  │⏰ Último: 15/06 10:30 │ │
│ │🟡 María (Recepcionista) │  │  ├───────────────────────┤ │
│ │   Último acceso: 09:15  │  │  │✅ Gestión Pacientes   │ │
│ │   Estado: ✅ Activo     │  │  │✅ Comunicaciones      │ │
│ └─────────────────────────┘  │  │✅ Agenda              │ │
│ ┌─────────────────────────┐  │  │❌ Configuración      │ │
│ │🔴 Luis (Dental)         │  │  │❌ Usuarios           │ │
│ │   Último acceso: hace 3d│  │  └───────────────────────┘ │
│ │   Estado: ⏸️ Inactivo   │  │                           │
│ └─────────────────────────┘  └───────────────────────────┘


### Roles y Permisos:

#### Administrador (Full Access):
- ✅ Todos los módulos
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Estadísticas completas
- ✅ Exportación de datos
- ✅ Integraciones externas

#### Doctor/Dentista:
- ✅ Panel de control
- ✅ Agenda (completa)
- ✅ Pacientes (completa)
- ✅ Comunicaciones
- ✅ Consentimientos
- ✅ Entrenar IA
- ❌ Gestión usuarios
- ❌ Configuración sistema

#### Recepcionista:
- ✅ Panel de control (limitado)
- ✅ Agenda (crear/modificar citas)
- ✅ Pacientes (datos básicos)
- ✅ Comunicaciones (solo lectura)
- ✅ Recordatorios
- ❌ Consentimientos
- ❌ IA y automatizaciones
- ❌ Configuración

#### Asistente Dental:
- ✅ Panel de control (básico)
- ✅ Agenda (solo lectura)
- ✅ Pacientes (solo lectura)
- ❌ Comunicaciones
- ❌ Configuración

### Creación/Edición de Usuario:

┌─────────────────────────────────────────┐
│ ➕ Nuevo Usuario                        │
├─────────────────────────────────────────┤
│ Datos Básicos:                          │
│ Nombre: [Input]                         │
│ Email: [Input]                          │
│ Teléfono: [Input]                       │
│ Usuario: [Input]                        │
│ Contraseña: [Input] [🔐 Generar]        │
│                                         │
│ Rol: [Administrador ▼]                  │
│                                         │
│ Permisos Específicos:                   │
│ ┌─────────────────────────────────────┐ │
│ │ ☑️ Panel de Control                 │ │
│ │ ☑️ Agenda                           │ │
│ │ ☑️ Pacientes                        │ │
│ │ ☐ Comunicaciones                    │ │
│ │ ☐ Configuración                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancelar] [Crear Usuario]              │
└─────────────────────────────────────────┘


### Registro de Actividad:
- Log completo de acciones por usuario
- Timestamps detallados
- IP y dispositivo de acceso
- Acciones críticas destacadas
- Filtros por usuario, fecha, acción
- Exportación de logs para auditoría

### Seguridad:
- Contraseñas seguras obligatorias
- 2FA opcional por usuario
- Sesiones con timeout configurable
- Bloqueo por intentos fallidos
- Notificaciones de accesos sospechosos

## ⚙️ 10. CONFIGURACIÓN

### Panel de Configuración General:

┌─────────────────────────────────────────────────────────┐
│ ⚙️ Configuración del Sistema                            │
├─────────────────────────────────────────────────────────┤
│ [🏥 Clínica] [⏰ Horarios] [💬 WhatsApp] [🔄 Sync]      │
├─────────────────────────────────────────────────────────┤
│ Información de la Clínica   │    Horarios de Trabajo    │
│ ┌─────────────────────────┐  │  ┌───────────────────────┐ │
│ │Nombre: RUBIO GARCÍA     │  │  │Lunes:    09:00-18:00  │ │
│ │       DENTAL            │  │  │Martes:   09:00-18:00  │ │
│ │Dirección: [Input]       │  │  │Miércoles: 09:00-18:00 │ │
│ │Teléfono: [Input]        │  │  │Jueves:   09:00-18:00  │ │
│ │Email: [Input]           │  │  │Viernes:  09:00-15:00  │ │
│ │CIF: [Input]             │  │  │Sábado:   ❌ Cerrado   │ │
│ │Logo: [📷 Upload]        │  │  │Domingo:  ❌ Cerrado   │ │
│ └─────────────────────────┘  └─┴───────────────────────┴─┘
└─────────────────────────────────────────────────────────┘


### Configuraciones por Sección:

#### 🏥 Información de la Clínica:
- Nombre comercial: RUBIO GARCÍA DENTAL
- Dirección completa
- Teléfono principal y secundario
- Email de contacto
- CIF/NIF
- Logo (upload + preview)
- Colores corporativos (picker)
- Página web (opcional)

#### ⏰ Configuración de Horarios:
- Horarios por día de la semana
- Pausas/descansos configurables
- Días festivos (calendario anual)
- Vacaciones por doctor
- Duración predeterminada de citas por tratamiento
- Tiempo buffer entre citas
- Horarios especiales (días específicos)

#### 💬 Configuración WhatsApp:
- Estado conexión: Conectado/Desconectado
- Número asociado
- QR Code para reconexión
- Templates de mensajes automáticos
- Horarios de respuesta automática
- Mensaje fuera de horario
- Auto-respuestas por palabras clave

#### 🔄 Sincronización y Integraciones:

##### Google Sheets:
- Estado: ✅ Conectado / ❌ Desconectado
- Hoja activa: [Selector]
- Frecuencia sync: Cada 15min / 30min / 1h
- Última sincronización: 15/06/2025 10:30
- Dirección datos: Bidireccional / Solo lectura / Solo escritura

##### Gesden SQL:
- Servidor: [Input IP/Host]
- Base de datos: [Input]
- Usuario: [Input]
- Estado conexión: ✅ / ❌
- Tablas sincronizadas: Pacientes, Citas, Tratamientos
- Campos mapeados: [Ver mapping]

#### 🤖 Configuración IA:
- Modelo IA: GPT-4 / Claude / Gemini
- Personalidad: Profesional / Amigable / Técnica
- Idioma principal: Español
- Idiomas adicionales: Catalán, Inglés
- Confianza mínima: 70% (slider)
- Escalada a humano: Si confianza < 70%

#### 📧 Configuración Email:
- Servidor SMTP: [Input]
- Puerto: [Input]
- Usuario: [Input]
- Contraseña: [Input]
- Encriptación: TLS / SSL
- Email remitente: [Input]
- Plantilla email: [Editor HTML]

#### 🔐 Configuración Seguridad:
- Tiempo sesión: 2h / 4h / 8h / 24h
- 2FA obligatorio: ✅ / ❌
- Intentos login: 3 / 5 / 10
- Bloqueo temporal: 15min / 30min / 1h
- Logs de auditoría: ✅ Activado
- Backup automático: Diario / Semanal

#### 💾 Configuración Backup:
- Frecuencia: Diario a las 02:00
- Retención: 30 días
- Incluir: Base datos + Archivos + Configuración
- Destino: Local / Google Drive / AWS S3
- Última copia: 15/06/2025 02:00
- Estado: ✅ Éxito

#### 📊 Configuración Reportes:
- Reportes automáticos: Semanal / Mensual
- Destinatarios: [Lista emails]
- Contenido: KPIs + Gráficos + Resumen
- Formato: PDF / Excel / HTML
- Horario envío: Lunes 08:00

## 🔄 11. GESTIÓN GESDEN

### Dashboard Sincronización Gesden:

┌─────────────────────────────────────────────────────────┐
│ 🔄 Gestión de Sincronización con Gesden                │
├─────────────────────────────────────────────────────────┤
│ [📊 Estado] [🔄 Sincronizar] [⚙️ Configurar] [📋 Logs] │
├─────────────────────────────────────────────────────────┤
│ Estado de Conexión          │    Estadísticas Sync     │
│ ┌─────────────────────────┐  │  ┌───────────────────────┐ │
│ │🟢 Conectado a Gesden    │  │  │📈 Última sync: 10:30  │ │
│ │🏥 Servidor: GABINETE2   │  │  │📊 Pacientes: 1,247    │ │
│ │💾 Base: GesdenDB        │  │  │📅 Citas: 156          │ │
│ │⚡ Versión: 5.2.1        │  │  │💰 Facturación: €45K   │ │
│ │⏰ Ping: 12ms            │  │  │⚠️  Conflictos: 3      │ │
│ └─────────────────────────┘  └─┴───────────────────────┴─┘
├─────────────────────────────────────────────────────────┤
│ Procesos de Sincronización                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ SaaS → Gesden  │ ✅ Activo │ Cada 15min │ ✅ Éxito │ │
│ │ Gesden → SaaS  │ ✅ Activo │ Cada 30min │ ✅ Éxito │ │
│ │ Google Sheets  │ ✅ Activo │ Cada 1h    │ ⚠️  3 err │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘


### Configuración de Conexión:

#### Datos de Conexión:

┌─────────────────────────────────────────┐
│ 🔌 Configuración Conexión Gesden        │
├─────────────────────────────────────────┤
│ Servidor: [GABINETE2        ]           │
│ Puerto: [1433              ]            │
│ Base de datos: [GesdenDB    ]           │
│ Usuario: [sa               ]            │
│ Contraseña: [**********    ]            │
│ Driver: [SQL Server ▼      ]           │
│                                         │
│ Configuración Avanzada:                │
│ Timeout: [30s ▼]                       │
│ Pool conexiones: [5 ▼]                 │
│ Retry intentos: [3 ▼]                  │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Encriptación SSL                 │ │
│ │ ✅ Verificar certificado            │ │
│ │ ✅ Auto-reconexión                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🧪 Probar Conexión] [💾 Guardar]       │
└─────────────────────────────────────────┘


### Mapeo de Datos:

#### Configuración de Tablas:

┌─────────────────────────────────────────────────────────┐
│ 🗺️  Mapeo de Datos SaaS ↔ Gesden                       │
├─────────────────────────────────────────────────────────┤
│ SaaS Field          │ Gesden Table.Field   │ Tipo  │ ✓  │
├─────────────────────────────────────────────────────────┤
│ patient.name        │ pacientes.nombre     │ TEXT  │ ✅ │
│ patient.phone       │ pacientes.telefono   │ TEXT  │ ✅ │
│ patient.email       │ pacientes.email      │ TEXT  │ ✅ │
│ patient.birthdate   │ pacientes.fnac       │ DATE  │ ✅ │
│ appointment.date    │ citas.fecha          │ DATE  │ ✅ │
│ appointment.time    │ citas.hora           │ TIME  │ ✅ │
│ appointment.doctor  │ citas.doctor_id      │ INT   │ ✅ │
│ treatment.name      │ tratamientos.nombre  │ TEXT  │ ✅ │
│ treatment.price     │ tratamientos.precio  │ MONEY │ ✅ │
├─────────────────────────────────────────────────────────┤
│ [➕ Añadir Campo] [✏️ Editar] [❌ Eliminar]              │
└─────────────────────────────────────────────────────────┘


### Procesos de Sincronización:

#### Flujo SaaS → Gesden:
1. Detección cambios en SaaS (cada 15min)
2. Validación de datos según mapeo
3. Transformación a formato Gesden
4. Insert/Update en base Gesden
5. Log de operaciones realizadas
6. Notificación de errores si los hay

#### Flujo Gesden → SaaS:
1. Query incremental a Gesden (timestamp)
2. Extracción de registros nuevos/modificados
3. Transformación a formato SaaS
4. Validación de integridad de datos
5. Update en MongoDB
6. Sincronización con interfaz usuario

### Resolución de Conflictos:

#### Tipos de Conflicto:
- Registro duplicado: Mismo paciente en ambos sistemas
- Datos diferentes: Información conflictiva entre sistemas
- Eliminación vs Modificación: Un sistema elimina, otro modifica
- Constraints violadas: Datos que no cumplen reglas de negocio

#### Estrategias de Resolución:

┌─────────────────────────────────────────┐
│ ⚠️  Resolución de Conflictos             │
├─────────────────────────────────────────┤
│ Regla por defecto:                      │
│ • SaaS tiene prioridad ✅               │
│ • Gesden tiene prioridad ❌             │
│ • Resolución manual ❌                  │
│                                         │
│ Excepciones específicas:                │
│ • Datos financieros → Gesden            │
│ • Datos de contacto → SaaS              │
│ • Historial clínico → Gesden            │
│ • Comunicaciones → SaaS                 │
│                                         │
│ Notificaciones:                         │
│ ☑️ Email en conflictos                  │
│ ☑️ Log detallado                        │
│ ☐ Parar sync en error crítico          │
└─────────────────────────────────────────┘


### Monitoring y Logs:

#### Dashboard en Tiempo Real:
- Estado conexión: Verde/Amarillo/Rojo
- Última sincronización: Timestamp
- Registros procesados: Contador
- Errores pendientes: Lista con prioridad
- Performance: Tiempo promedio de sync

#### Logs Detallados:

[2025-06-15 10:30:15] INFO: Iniciando sincronización SaaS → Gesden
[2025-06-15 10:30:16] INFO: Procesados 45 pacientes, 12 citas
[2025-06-15 10:30:17] WARN: Conflicto en paciente ID:1247 - email diferente
[2025-06-15 10:30:17] INFO: Aplicada regla: SaaS tiene prioridad
[2025-06-15 10:30:18] ERROR: Fallo conexión - reintentando en 30s
[2025-06-15 10:30:48] INFO: Reconexión exitosa
[2025-06-15 10:30:50] INFO: Sincronización completada - 0 errores


## 🌐 INTEGRACIONES ESPECIALES

### WhatsApp Service (Node.js):

#### Arquitectura:
- Baileys como biblioteca principal
- Servicio independiente en puerto 3001
- API REST para comunicación con backend
- Persistencia de sesión en archivos
- Manejo de QR para conexión inicial

#### Endpoints API:
javascript
// WhatsApp Service endpoints
POST /start          // Iniciar servicio WhatsApp
POST /stop           // Detener servicio
GET  /status         // Estado de conexión
GET  /qr             // Obtener código QR
POST /send-message   // Enviar mensaje
POST /reconnect      // Forzar reconexión


### Google Sheets Integration:

#### Service Account Setup:
- Credenciales JSON seguras
- Scopes mínimos necesarios
- API de Sheets v4
- Autenticación automática

#### Sincronización Bidireccional:
- Google Sheets → SaaS: Importar datos nuevos
- SaaS → Google Sheets: Exportar cambios
- Detección de cambios por timestamp
- Mapeo de columnas configurable

### Emergent LLM Integration:

#### Configuración IA:
- Universal Key para múltiples proveedores
- Modelo seleccionable: GPT-4, Claude, Gemini
- Gestión de tokens y costos
- Fallback entre modelos

#### Casos de Uso:
- Análisis de sentimientos en WhatsApp
- Clasificación automática de consultas
- Generación de respuestas contextual
- Resúmenes de conversaciones

## 🔧 ESPECIFICACIONES TÉCNICAS

### Frontend (React):

#### Dependencias Principales:
json
{
  "react": "^18.0.0",
  "tailwindcss": "^3.4.0",
  "@shadcn/ui": "latest",
  "lucide-react": "^0.400.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.6.0",
  "react-hook-form": "^7.0.0",
  "date-fns": "^2.30.0"
}


#### Estructura de Componentes:

src/
├── components/
│   ├── ui/           // Shadcn components
│   ├── layout/       // Header, Sidebar, etc.
│   ├── dashboard/    // Dashboard específicos
│   └── modals/       // Modales reutilizables
├── pages/            // Páginas principales
├── hooks/            // Custom hooks
├── utils/            // Utilidades
└── contexts/         // React contexts


### Backend (FastAPI):

#### Dependencias:
python
fastapi==0.104.0
pymongo==4.6.0
motor==3.3.0
pydantic==2.5.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
apscheduler==3.10.0
reportlab==4.0.0
pyodbc==4.0.39
emergentintegrations==latest


#### Estructura de Rutas:
python
/api/auth/          # Autenticación
/api/dashboard/     # Dashboard stats
/api/patients/      # Gestión pacientes
/api/appointments/  # Gestión citas
/api/whatsapp/      # Comunicaciones
/api/ai/           # Funciones IA
/api/sync/         # Sincronización
/api/users/        # Gestión usuarios
/api/config/       # Configuración


### Base de Datos (MongoDB):

#### Colecciones:
javascript
// Usuarios
users: {
  _id: ObjectId,
  username: String,
  email: String,
  password_hash: String,
  role: String,
  permissions: Array,
  created_at: Date,
  last_login: Date
}

// Pacientes
patients: {
  _id: ObjectId,
  patient_id: String, // UUID
  name: String,
  surname: String,
  phone: String,
  email: String,
  birthdate: Date,
  address: String,
  allergies: String,
  notes: String,
  created_at: Date,
  updated_at: Date
}

// Citas
appointments: {
  _id: ObjectId,
  appointment_id: String, // UUID
  patient_id: String,
  doctor_id: String,
  date: Date,
  time: String,
  duration: Number,
  treatment: String,
  status: String, // programada, confirmada, completada, cancelada
  notes: String,
  created_at: Date,
  updated_at: Date
}

// Conversaciones WhatsApp
conversations: {
  _id: ObjectId,
  patient_id: String,
  phone: String,
  messages: [{
    id: String,
    from: String,
    to: String,
    message: String,
    timestamp: Date,
    type: String, // text, image, document
    status: String // sent, delivered, read
  }],
  last_message: Date,
  unread_count: Number
}


## 🎯 CRITERIOS DE ÉXITO

### Funcionalidad Obligatoria:
- ✅ Autenticación completa con roles
- ✅ CRUD pacientes con búsqueda avanzada
- ✅ Gestión agenda con vista calendario
- ✅ WhatsApp integración completa (envío/recepción)
- ✅ Recordatorios automáticos configurables
- ✅ Consentimientos digitales con PDF
- ✅ Dashboard con KPIs en tiempo real
- ✅ Sincronización Gesden bidireccional
- ✅ IA para triaje y respuestas automáticas

### Performance:
- Tiempo carga inicial: < 3 segundos
- Respuesta API: < 500ms promedio
- WhatsApp entrega: < 10 segundos
- Sincronización: < 5 minutos para 1000 registros

### UX/UI:
- Responsive en móvil, tablet, desktop
- Accesibilidad básica (WCAG 2.1 AA)
- Navegación intuitiva sin entrenamiento
- Feedback visual en todas las acciones
- Estados de carga en procesos largos

### Seguridad:
- Contraseñas hasheadas (bcrypt)
- JWT con refresh token
- Validación de entrada en todos los endpoints
- CORS configurado correctamente
- Logs de auditoría para acciones críticas

## 🚀 DESPLIEGUE Y CONFIGURACIÓN

### Variables de Entorno:

#### Backend (.env):

MONGO_URL=mongodb://localhost:27017/rubio_garcia_dental
JWT_SECRET=your-secret-key
GESDEN_SERVER=GABINETE2
GESDEN_DATABASE=GesdenDB
GESDEN_USER=sa
GESDEN_PASSWORD=your-password
GOOGLE_SHEETS_CREDENTIALS_PATH=./service-account-key.json
WHATSAPP_SERVICE_URL=http://localhost:3001
EMERGENT_LLM_KEY=your-emergent-key


#### Frontend (.env):

REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_APP_NAME=RUBIO GARCÍA DENTAL


### Servicios Docker:
yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://backend:8001
  
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017/rubio_garcia_dental
  
  whatsapp-service:
    build: ./whatsapp-service
    ports:
      - "3001:3001"
    volumes:
      - ./sessions:/app/sessions
  
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db


## 📝 NOTAS FINALES

### Prioridades de Desarrollo:
1. Fase 1: Autenticación + Dashboard + Pacientes
2. Fase 2: Agenda + WhatsApp básico
3. Fase 3: Recordatorios + Consentimientos
4. Fase 4: IA + Automatizaciones
5. Fase 5: Sincronización Gesden completa

### Consideraciones Importantes:
- Branding exacto: "RUBIO GARCÍA DENTAL" con tilde
- Responsive obligatorio: Móvil es crítico para recepcionistas
- WhatsApp estable: Reconexión automática esencial
- Gesden sync: Requiere acceso al servidor GABINETE2
- Performance: Sistema usado intensivamente durante horas clínica

### Testing Mínimo:
- Unit tests para funciones críticas de backend
- Integration tests para APIs principales
- E2E tests para flujos principales de usuario
- Manual testing de WhatsApp integration
- Performance testing con datos reales

---

Este prompt representa la especificación completa para desarrollar el sistema RUBIO GARCÍA DENTAL desde cero, incluyendo todos los aspectos técnicos, funcionales y de diseño necesarios para su implementación exitosa. --status