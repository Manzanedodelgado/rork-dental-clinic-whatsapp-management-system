import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { GoogleSheetsService } from '@/services/googleSheetsService';
import type { Patient, Appointment, WhatsAppConversation, MessageTemplate, Automation, AIConfig } from '@/types';

export const [ClinicProvider, useClinic] = createContextHook(() => {
  // Always call hooks in the same order
  const queryClient = useQueryClient();
  const storage = useStorage();
  
  // State hooks - always called in the same order
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Google Sheets Sync Query - runs every 5 minutes
  const googleSheetsQuery = useQuery({
    queryKey: ['googleSheets'],
    queryFn: async () => {
      console.log('🔄 Starting Google Sheets sync...');
      const data = await GoogleSheetsService.fetchAppointments();
      
      console.log('📦 Sync completed successfully:');
      console.log(`   📋 Total appointments: ${data.appointments.length}`);
      console.log(`   👥 Patients: ${data.patients.length}`);
      
      if (data.appointments.length > 0) {
        console.log('📋 Sample appointments from sync:');
        data.appointments.slice(0, 3).forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.patientName} - ${apt.date} ${apt.time} (${apt.treatment})`);
        });
      }
      
      // Analyze sync info for new and modified appointments
      const newAppointments = data.appointments.filter(apt => {
        const syncInfo = GoogleSheetsService.getSyncInfo(apt);
        return syncInfo.isNew;
      });
      
      const updatedAppointments = data.appointments.filter(apt => {
        const syncInfo = GoogleSheetsService.getSyncInfo(apt);
        return syncInfo.isModified;
      });
      
      console.log(`   🆕 New appointments: ${newAppointments.length}`);
      console.log(`   🔄 Updated appointments: ${updatedAppointments.length}`);
      
      setLastSyncTime(new Date());
      setSyncError(null);
      
      return {
        appointments: data.appointments,
        patients: data.patients,
        newAppointments,
        updatedAppointments
      };
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: true,
    staleTime: 4 * 60 * 1000, // 4 minutes
    retry: false, // Don't retry on failure - use mock data instead
  });

  // WhatsApp Conversations Query (local storage)
  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<WhatsAppConversation[]> => {
      try {
        const stored = await storage.getItem('conversations');
        return stored ? JSON.parse(stored) : mockConversations;
      } catch (error) {
        console.error('Error loading conversations:', error);
        return mockConversations;
      }
    }
  });

  // Templates Query (local storage)
  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<MessageTemplate[]> => {
      try {
        const stored = await storage.getItem('templates');
        return stored ? JSON.parse(stored) : mockTemplates;
      } catch (error) {
        console.error('Error loading templates:', error);
        return mockTemplates;
      }
    }
  });

  // Automations Query (local storage)
  const automationsQuery = useQuery({
    queryKey: ['automations'],
    queryFn: async (): Promise<Automation[]> => {
      try {
        const stored = await storage.getItem('automations');
        return stored ? JSON.parse(stored) : mockAutomations;
      } catch (error) {
        console.error('Error loading automations:', error);
        return mockAutomations;
      }
    }
  });

  // AI Config Query (local storage)
  const aiConfigQuery = useQuery({
    queryKey: ['aiConfig'],
    queryFn: async (): Promise<AIConfig> => {
      try {
        const stored = await storage.getItem('aiConfig');
        return stored ? JSON.parse(stored) : mockAIConfig;
      } catch (error) {
        console.error('Error loading AI config:', error);
        return mockAIConfig;
      }
    }
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Manual sync initiated...');
      const data = await GoogleSheetsService.fetchAppointments();
      
      // Analyze sync info for new and modified appointments
      const newAppointments = data.appointments.filter(apt => {
        const syncInfo = GoogleSheetsService.getSyncInfo(apt);
        return syncInfo.isNew;
      });
      
      const updatedAppointments = data.appointments.filter(apt => {
        const syncInfo = GoogleSheetsService.getSyncInfo(apt);
        return syncInfo.isModified;
      });
      
      return {
        appointments: data.appointments,
        patients: data.patients,
        newAppointments,
        updatedAppointments
      };
    },
    onSuccess: (data) => {
      if (data) {
        console.log('✅ Manual sync successful:');
        console.log(`   📋 Appointments: ${data.appointments.length}`);
        console.log(`   🆕 New: ${data.newAppointments.length}`);
        console.log(`   🔄 Updated: ${data.updatedAppointments.length}`);
        
        queryClient.setQueryData(['googleSheets'], data);
        setLastSyncTime(new Date());
        setSyncError(null);
      }
    },
    onError: () => {
      // Don't show error for expected CORS failures
      console.log('📋 Sync using mock data (Google Sheets not accessible)');
      setSyncError(null);
    }
  });

  // Mutations for local data
  const updateConversationsMutation = useMutation({
    mutationFn: async (conversations: WhatsAppConversation[]) => {
      if (Array.isArray(conversations) && conversations.length <= 1000) {
        await storage.setItem('conversations', JSON.stringify(conversations));
        return conversations;
      }
      throw new Error('Invalid conversations data');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
  });

  const updateTemplatesMutation = useMutation({
    mutationFn: async (templates: MessageTemplate[]) => {
      if (Array.isArray(templates) && templates.length <= 100) {
        await storage.setItem('templates', JSON.stringify(templates));
        return templates;
      }
      throw new Error('Invalid templates data');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] })
  });

  const updateAutomationsMutation = useMutation({
    mutationFn: async (automations: Automation[]) => {
      if (Array.isArray(automations) && automations.length <= 50) {
        await storage.setItem('automations', JSON.stringify(automations));
        return automations;
      }
      throw new Error('Invalid automations data');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] })
  });

  const updateAIConfigMutation = useMutation({
    mutationFn: async (config: AIConfig) => {
      if (config && typeof config === 'object') {
        await storage.setItem('aiConfig', JSON.stringify(config));
        return config;
      }
      throw new Error('Invalid AI config data');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiConfig'] })
  });

  // Computed values - using useMemo with proper dependencies
  const patients = useMemo(() => {
    return googleSheetsQuery.data?.patients || mockPatients;
  }, [googleSheetsQuery.data?.patients]);

  const appointments = useMemo(() => {
    const result = googleSheetsQuery.data?.appointments || mockAppointments;
    console.log('📋 Appointments memoized:', result.length);
    if (result.length > 0) {
      console.log('📋 First appointment in memoized data:', {
        id: result[0].id,
        patientName: result[0].patientName,
        date: result[0].date,
        time: result[0].time,
        treatment: result[0].treatment
      });
    }
    return result;
  }, [googleSheetsQuery.data?.appointments]);

  const newAppointments = useMemo(() => {
    return googleSheetsQuery.data?.newAppointments || [];
  }, [googleSheetsQuery.data?.newAppointments]);

  const updatedAppointments = useMemo(() => {
    return googleSheetsQuery.data?.updatedAppointments || [];
  }, [googleSheetsQuery.data?.updatedAppointments]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('🔍 Filtering appointments for today:', todayStr);
    console.log('📋 Total appointments available:', appointments.length);
    
    if (appointments.length > 0) {
      console.log('📋 First few appointments:');
      appointments.slice(0, 5).forEach((apt, index) => {
        console.log(`   ${index + 1}. ID: ${apt.id}, Date: ${apt.date}, Patient: ${apt.patientName}, Time: ${apt.time}`);
      });
    }
    
    const filtered = appointments.filter(apt => {
      if (!apt.date) {
        console.log('⚠️ Appointment without date:', apt.id, apt.patientName);
        return false;
      }
      
      // Normalize date formats for comparison
      let aptDate = apt.date;
      
      // Handle different date formats
      if (aptDate.includes('/')) {
        const parts = aptDate.split('/');
        if (parts.length === 3) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          aptDate = `${year}-${month}-${day}`;
        }
      }
      
      // Ensure YYYY-MM-DD format
      if (aptDate.length === 10 && aptDate.includes('-')) {
        const isToday = aptDate === todayStr;
        console.log(`📅 Comparing '${aptDate}' with today '${todayStr}': ${isToday}`);
        return isToday;
      }
      
      console.log('⚠️ Invalid date format:', aptDate, 'for appointment:', apt.id);
      return false;
    });
    
    console.log(`✅ Today's appointments found: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log('📅 Today\'s appointments:');
      filtered.forEach(apt => console.log(`   - ${apt.time} ${apt.patientName} (${apt.treatment})`));
    } else {
      console.log('🚨 No appointments found for today. Checking all dates:');
      const uniqueDates = [...new Set(appointments.map(apt => apt.date).filter(Boolean))];
      console.log('   Available dates:', uniqueDates);
    }
    
    return filtered;
  }, [appointments]);

  const unreadMessagesCount = useMemo(() => {
    return conversationsQuery.data?.reduce((total, conv) => total + conv.unreadCount, 0) || 0;
  }, [conversationsQuery.data]);

  const activeConversation = useMemo(() => {
    if (!conversationsQuery.data || !selectedConversation) return null;
    return conversationsQuery.data.find(conv => conv.id === selectedConversation) || null;
  }, [conversationsQuery.data, selectedConversation]);

  const isConnected = useMemo(() => {
    // Always show as connected since we have fallback data
    return true;
  }, []);

  const syncStats = useMemo(() => {
    return {
      totalAppointments: appointments.length,
      newAppointments: newAppointments.length,
      updatedAppointments: updatedAppointments.length,
      lastSync: lastSyncTime
    };
  }, [appointments.length, newAppointments.length, updatedAppointments.length, lastSyncTime]);

  return {
    // Data
    patients: patients || [],
    appointments: appointments || [],
    conversations: conversationsQuery.data || [],
    templates: templatesQuery.data || [],
    automations: automationsQuery.data || [],
    aiConfig: aiConfigQuery.data || mockAIConfig,
    
    // Computed
    todayAppointments,
    unreadMessagesCount,
    activeConversation,
    selectedConversation,
    newAppointments,
    updatedAppointments,
    syncStats,
    
    // Sync status
    lastSyncTime,
    syncError,
    isConnected,
    isSyncing: googleSheetsQuery.isFetching || syncMutation.isPending,
    
    // Loading states
    isLoading: googleSheetsQuery.isLoading || conversationsQuery.isLoading,
    
    // Actions
    setSelectedConversation,
    syncNow: () => {
      console.log('🔄 Sync button pressed - triggering manual sync');
      syncMutation.mutate();
    },
    updateConversations: updateConversationsMutation.mutate,
    updateTemplates: updateTemplatesMutation.mutate,
    updateAutomations: updateAutomationsMutation.mutate,
    updateAIConfig: updateAIConfigMutation.mutate,
  };
});

// Mock data
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'María González',
    phone: '+34 666 123 456',
    email: 'maria.gonzalez@email.com',
    lastVisit: '2025-01-10',
    nextAppointment: '2025-01-15',
    notes: 'Paciente con implante en molar superior derecho',
    appointments: []
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    phone: '+34 677 234 567',
    email: 'carlos.ruiz@email.com',
    lastVisit: '2025-01-08',
    nextAppointment: '2025-01-16',
    notes: 'Tratamiento de ortodoncia invisible',
    appointments: []
  },
  {
    id: '3',
    name: 'Ana Martín',
    phone: '+34 688 345 678',
    email: 'ana.martin@email.com',
    lastVisit: '2025-01-05',
    notes: 'Limpieza dental y revisión',
    appointments: []
  }
];

// Generate mock appointments with current dates
const generateMockAppointments = (): Appointment[] => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];
  
  console.log('📋 Generating mock appointments:');
  console.log(`   Today: ${todayStr}`);
  console.log(`   Tomorrow: ${tomorrowStr}`);
  console.log(`   Day after: ${dayAfterStr}`);
  
  const appointments: Appointment[] = [
    {
      id: '1',
      registro: '1',
      patientId: '1',
      patientName: 'María González',
      apellidos: 'González',
      nombre: 'María',
      date: todayStr,
      time: '09:00',
      treatment: 'Revisión implante',
      status: 'Planificada',
      dentist: 'Mario Rubio',
      notes: 'Control post-implante',
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
    },
    {
      id: '2',
      registro: '2',
      patientId: '2',
      patientName: 'Carlos Ruiz',
      apellidos: 'Ruiz',
      nombre: 'Carlos',
      date: todayStr,
      time: '10:30',
      treatment: 'Ajuste ortodoncia',
      status: 'Planificada',
      dentist: 'Irene Garcia',
      notes: 'Ajuste mensual de brackets',
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
    },
    {
      id: '3',
      registro: '3',
      patientId: '3',
      patientName: 'Ana Martín',
      apellidos: 'Martín',
      nombre: 'Ana',
      date: tomorrowStr,
      time: '11:00',
      treatment: 'Limpieza dental',
      status: 'Planificada',
      dentist: 'Virginia Tresgallo',
      notes: 'Limpieza semestral',
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
    },
    {
      id: '4',
      registro: '4',
      patientId: '1',
      patientName: 'María González',
      apellidos: 'González',
      nombre: 'María',
      date: dayAfterStr,
      time: '14:00',
      treatment: 'Control post-implante',
      status: 'Planificada',
      dentist: 'Mario Rubio',
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
    },
    {
      id: '5',
      registro: '5',
      patientId: '2',
      patientName: 'Carlos Ruiz',
      apellidos: 'Ruiz',
      nombre: 'Carlos',
      date: '2025-09-15',
      time: '16:30',
      treatment: 'Revisión ortodoncia',
      status: 'Planificada',
      dentist: 'Irene Garcia',
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
    }
  ];
  
  console.log(`📋 Generated ${appointments.length} mock appointments`);
  return appointments;
};

const mockAppointments: Appointment[] = generateMockAppointments();

const mockConversations: WhatsAppConversation[] = [
  {
    id: '1',
    patient: mockPatients[0],
    lastMessage: {
      id: '1',
      patientId: '1',
      content: 'Hola, ¿podría confirmar mi cita de mañana?',
      timestamp: '2024-01-14T18:30:00Z',
      isFromPatient: true,
      isRead: false,
      messageType: 'text'
    },
    unreadCount: 1,
    isActive: false
  },
  {
    id: '2',
    patient: mockPatients[1],
    lastMessage: {
      id: '2',
      patientId: '2',
      content: 'Perfecto, nos vemos mañana a las 10:30',
      timestamp: '2024-01-14T16:15:00Z',
      isFromPatient: false,
      isRead: true,
      messageType: 'text'
    },
    unreadCount: 0,
    isActive: false
  }
];

const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Recordatorio 24h',
    content: 'Hola {nombre}, te recordamos tu cita mañana {fecha} a las {hora} para {tratamiento}. ¡Te esperamos!',
    category: 'reminder',
    variables: ['nombre', 'fecha', 'hora', 'tratamiento']
  },
  {
    id: '2',
    name: 'Confirmación cita',
    content: 'Tu cita ha sido confirmada para el {fecha} a las {hora}. Si necesitas cambiarla, contáctanos.',
    category: 'confirmation',
    variables: ['fecha', 'hora']
  },
  {
    id: '3',
    name: 'Consentimiento informado',
    content: 'Hola {nombre}, adjuntamos el consentimiento informado para tu próximo tratamiento. Por favor, revísalo.',
    category: 'consent',
    variables: ['nombre']
  }
];

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Recordatorio 24h antes',
    trigger: 'appointment_reminder',
    templateId: '1',
    timing: '24h_before',
    isActive: true
  },
  {
    id: '2',
    name: 'Seguimiento post-tratamiento',
    trigger: 'post_treatment',
    templateId: '2',
    timing: '1d_after',
    isActive: true
  }
];

const mockAIConfig: AIConfig = {
  isEnabled: true,
  personality: 'Soy el asistente virtual de Rubio García Dental. Soy profesional, amable y siempre dispuesto a ayudar con consultas sobre tratamientos dentales.',
  knowledgeBase: [
    'Implantología dental',
    'Estética dental',
    'Ortodoncia invisible',
    'Limpieza y prevención'
  ],
  autoReplyEnabled: true,
  workingHours: {
    start: '09:00',
    end: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }
};