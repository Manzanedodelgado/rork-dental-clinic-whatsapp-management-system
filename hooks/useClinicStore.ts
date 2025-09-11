import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { SQLServerService } from '@/services/sqlServerService';
import type { Patient, Appointment, WhatsAppConversation, MessageTemplate, Automation, AIConfig } from '@/types';

export const [ClinicProvider, useClinic] = createContextHook(() => {
  // Always call hooks in the same order
  const queryClient = useQueryClient();
  const storage = useStorage();
  
  // State hooks - always called in the same order
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // SQL Server Sync Query - runs every 5 minutes
  const sqlServerQuery = useQuery({
    queryKey: ['sqlServer'],
    queryFn: async () => {
      try {
        console.log('Syncing with SQL Server...');
        const data = await SQLServerService.fetchAppointments();
        setLastSyncTime(new Date());
        setSyncError(null);
        
        // Log new and updated appointments
        if (data.newAppointments.length > 0) {
          console.log(`${data.newAppointments.length} new appointments detected`);
        }
        if (data.updatedAppointments.length > 0) {
          console.log(`${data.updatedAppointments.length} appointments updated`);
        }
        
        return data;
      } catch (error) {
        console.error('SQL Server sync error:', error);
        setSyncError(error instanceof Error ? error.message : 'Error de sincronización');
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: true,
    staleTime: 4 * 60 * 1000, // 4 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      return await SQLServerService.fetchAppointments();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['sqlServer'], data);
        setLastSyncTime(new Date());
        setSyncError(null);
        
        // Log sync results
        console.log(`Manual sync completed: ${data.appointments.length} appointments`);
        if (data.newAppointments.length > 0) {
          console.log(`${data.newAppointments.length} new appointments detected`);
        }
        if (data.updatedAppointments.length > 0) {
          console.log(`${data.updatedAppointments.length} appointments updated`);
        }
      }
    },
    onError: (error) => {
      console.error('Manual sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error de sincronización manual';
      if (errorMessage.trim() && errorMessage.length <= 200) {
        setSyncError(errorMessage);
      }
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
    return sqlServerQuery.data?.patients || mockPatients;
  }, [sqlServerQuery.data?.patients]);

  const appointments = useMemo(() => {
    return sqlServerQuery.data?.appointments || mockAppointments;
  }, [sqlServerQuery.data?.appointments]);

  const newAppointments = useMemo(() => {
    return sqlServerQuery.data?.newAppointments || [];
  }, [sqlServerQuery.data?.newAppointments]);

  const updatedAppointments = useMemo(() => {
    return sqlServerQuery.data?.updatedAppointments || [];
  }, [sqlServerQuery.data?.updatedAppointments]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today);
  }, [appointments]);

  const unreadMessagesCount = useMemo(() => {
    return conversationsQuery.data?.reduce((total, conv) => total + conv.unreadCount, 0) || 0;
  }, [conversationsQuery.data]);

  const activeConversation = useMemo(() => {
    if (!conversationsQuery.data || !selectedConversation) return null;
    return conversationsQuery.data.find(conv => conv.id === selectedConversation) || null;
  }, [conversationsQuery.data, selectedConversation]);

  const isConnected = useMemo(() => {
    return !sqlServerQuery.isError && !syncError;
  }, [sqlServerQuery.isError, syncError]);

  const syncStats = useMemo(() => {
    return SQLServerService.getSyncStats();
  }, []);

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
    isSyncing: sqlServerQuery.isFetching || syncMutation.isPending,
    
    // Loading states
    isLoading: sqlServerQuery.isLoading || conversationsQuery.isLoading,
    
    // Actions
    setSelectedConversation,
    syncNow: syncMutation.mutate,
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
    lastVisit: '2024-01-10',
    nextAppointment: '2024-01-15',
    notes: 'Paciente con implante en molar superior derecho',
    appointments: []
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    phone: '+34 677 234 567',
    email: 'carlos.ruiz@email.com',
    lastVisit: '2024-01-08',
    nextAppointment: '2024-01-16',
    notes: 'Tratamiento de ortodoncia invisible',
    appointments: []
  },
  {
    id: '3',
    name: 'Ana Martín',
    phone: '+34 688 345 678',
    email: 'ana.martin@email.com',
    lastVisit: '2024-01-05',
    notes: 'Limpieza dental y revisión',
    appointments: []
  }
];

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'María González',
    date: '2024-01-15',
    time: '09:00',
    treatment: 'Revisión implante',
    status: 'scheduled'
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Carlos Ruiz',
    date: '2024-01-15',
    time: '10:30',
    treatment: 'Ajuste ortodoncia',
    status: 'scheduled'
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Ana Martín',
    date: '2024-01-16',
    time: '11:00',
    treatment: 'Limpieza dental',
    status: 'scheduled'
  }
];

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