import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Zap,
  Bell,
  Heart,
  Send
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import type { Automation } from '@/types';

const TRIGGER_TYPES = [
  { 
    id: 'appointment_reminder', 
    name: 'Recordatorio de Cita', 
    icon: Bell,
    description: 'Envía recordatorios antes de las citas'
  },
  { 
    id: 'post_treatment', 
    name: 'Post-Tratamiento', 
    icon: Heart,
    description: 'Seguimiento después del tratamiento'
  },
  { 
    id: 'birthday', 
    name: 'Cumpleaños', 
    icon: Calendar,
    description: 'Felicitaciones de cumpleaños'
  },
  { 
    id: 'manual', 
    name: 'Manual', 
    icon: Send,
    description: 'Activación manual'
  },
];

const TIMING_OPTIONS = [
  { id: '1h_before', name: '1 hora antes' },
  { id: '24h_before', name: '24 horas antes' },
  { id: '48h_before', name: '48 horas antes' },
  { id: '1w_before', name: '1 semana antes' },
  { id: '1d_after', name: '1 día después' },
  { id: '1w_after', name: '1 semana después' },
  { id: 'on_birthday', name: 'En el cumpleaños' },
];

export default function AutomationsScreen() {
  const { automations, updateAutomations, templates } = useClinic();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  const handleToggleAutomation = (automationId: string, isActive: boolean) => {
    const updatedAutomations = automations.map(automation =>
      automation.id === automationId 
        ? { ...automation, isActive }
        : automation
    );
    updateAutomations(updatedAutomations);
  };

  const handleDeleteAutomation = (automationId: string) => {
    Alert.alert(
      'Eliminar Automatización',
      '¿Estás seguro de que quieres eliminar esta automatización?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedAutomations = automations.filter(a => a.id !== automationId);
            updateAutomations(updatedAutomations);
          }
        }
      ]
    );
  };

  const handleEditAutomation = (automation: Automation) => {
    setSelectedAutomation(automation);
    setShowAddModal(true);
  };

  const renderAutomationItem = ({ item }: { item: Automation }) => {
    const triggerType = TRIGGER_TYPES.find(t => t.id === item.trigger);
    const template = templates.find(t => t.id === item.templateId);
    const timing = TIMING_OPTIONS.find(t => t.id === item.timing);

    return (
      <View style={styles.automationCard}>
        <View style={styles.automationHeader}>
          <View style={styles.automationTitleRow}>
            <View style={styles.automationIcon}>
              {triggerType?.icon && (
                <triggerType.icon color={Colors.light.primary} size={20} />
              )}
            </View>
            <View style={styles.automationInfo}>
              <Text style={styles.automationName}>{item.name}</Text>
              <Text style={styles.automationDescription}>
                {triggerType?.description}
              </Text>
            </View>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={(value) => handleToggleAutomation(item.id, value)}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
            thumbColor={item.isActive ? Colors.light.primary : Colors.light.textSecondary}
          />
        </View>

        <View style={styles.automationDetails}>
          <View style={styles.automationDetail}>
            <Clock color={Colors.light.textSecondary} size={14} />
            <Text style={styles.automationDetailText}>
              {timing?.name || item.timing}
            </Text>
          </View>
          <View style={styles.automationDetail}>
            <MessageSquare color={Colors.light.textSecondary} size={14} />
            <Text style={styles.automationDetailText}>
              {template?.name || 'Plantilla no encontrada'}
            </Text>
          </View>
        </View>

        <View style={styles.automationActions}>
          <TouchableOpacity
            style={styles.automationAction}
            onPress={() => handleEditAutomation(item)}
          >
            <Edit color={Colors.light.primary} size={16} />
            <Text style={styles.automationActionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.automationAction}
            onPress={() => handleDeleteAutomation(item.id)}
          >
            <Trash2 color={Colors.light.error} size={16} />
            <Text style={[styles.automationActionText, { color: Colors.light.error }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{automations.length}</Text>
        <Text style={styles.statLabel}>Total Automatizaciones</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {automations.filter(a => a.isActive).length}
        </Text>
        <Text style={styles.statLabel}>Activas</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {automations.filter(a => a.trigger === 'appointment_reminder').length}
        </Text>
        <Text style={styles.statLabel}>Recordatorios</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Automatizaciones</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            setSelectedAutomation(null);
            setShowAddModal(true);
          }}
        >
          <Plus color={Colors.light.surface} size={20} />
        </TouchableOpacity>
      </View>

      {renderStats()}

      <FlatList
        data={automations}
        renderItem={renderAutomationItem}
        keyExtractor={(item) => item.id}
        style={styles.automationsList}
        contentContainerStyle={styles.automationsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Zap color={Colors.light.textSecondary} size={48} />
            <Text style={styles.emptyStateText}>
              No hay automatizaciones configuradas
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Crea tu primera automatización para ahorrar tiempo
            </Text>
          </View>
        }
      />

      {/* Add/Edit Automation Modal */}
      <AutomationModal
        visible={showAddModal}
        automation={selectedAutomation}
        templates={templates}
        onClose={() => {
          setShowAddModal(false);
          setSelectedAutomation(null);
        }}
        onSave={(automation) => {
          if (selectedAutomation) {
            // Edit existing automation
            const updatedAutomations = automations.map(a => 
              a.id === automation.id ? automation : a
            );
            updateAutomations(updatedAutomations);
          } else {
            // Add new automation
            updateAutomations([...automations, automation]);
          }
          setShowAddModal(false);
          setSelectedAutomation(null);
        }}
      />
    </SafeAreaView>
  );
}

// Automation Modal Component
function AutomationModal({ 
  visible, 
  automation, 
  templates,
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  automation: Automation | null;
  templates: any[];
  onClose: () => void; 
  onSave: (automation: Automation) => void; 
}) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<Automation['trigger']>('appointment_reminder');
  const [templateId, setTemplateId] = useState('');
  const [timing, setTiming] = useState('24h_before');
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    if (automation) {
      setName(automation.name);
      setTrigger(automation.trigger);
      setTemplateId(automation.templateId);
      setTiming(automation.timing);
      setIsActive(automation.isActive);
    } else {
      setName('');
      setTrigger('appointment_reminder');
      setTemplateId(templates[0]?.id || '');
      setTiming('24h_before');
      setIsActive(true);
    }
  }, [automation, templates]);

  const handleSave = () => {
    if (!name.trim() || !templateId) {
      Alert.alert('Error', 'El nombre y la plantilla son obligatorios');
      return;
    }

    const automationData: Automation = {
      id: automation?.id || Date.now().toString(),
      name: name.trim(),
      trigger,
      templateId,
      timing,
      isActive
    };

    onSave(automationData);
  };

  const getAvailableTimings = () => {
    switch (trigger) {
      case 'appointment_reminder':
        return TIMING_OPTIONS.filter(t => t.id.includes('before'));
      case 'post_treatment':
        return TIMING_OPTIONS.filter(t => t.id.includes('after'));
      case 'birthday':
        return TIMING_OPTIONS.filter(t => t.id === 'on_birthday');
      default:
        return TIMING_OPTIONS;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {automation ? 'Editar Automatización' : 'Nueva Automatización'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <View style={styles.textInput}>
              <Text style={styles.textInputText}>{name || 'Nombre de la automatización'}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Disparador</Text>
            <View style={styles.triggerSelector}>
              {TRIGGER_TYPES.map((triggerType) => (
                <TouchableOpacity
                  key={triggerType.id}
                  style={[
                    styles.triggerOption,
                    trigger === triggerType.id && styles.triggerOptionActive
                  ]}
                  onPress={() => setTrigger(triggerType.id as Automation['trigger'])}
                >
                  <View style={styles.triggerOptionIcon}>
                    <triggerType.icon 
                      color={trigger === triggerType.id ? Colors.light.surface : Colors.light.primary} 
                      size={20} 
                    />
                  </View>
                  <View style={styles.triggerOptionContent}>
                    <Text style={[
                      styles.triggerOptionName,
                      trigger === triggerType.id && styles.triggerOptionNameActive
                    ]}>
                      {triggerType.name}
                    </Text>
                    <Text style={[
                      styles.triggerOptionDescription,
                      trigger === triggerType.id && styles.triggerOptionDescriptionActive
                    ]}>
                      {triggerType.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Momento de Envío</Text>
            <View style={styles.timingSelector}>
              {getAvailableTimings().map((timingOption) => (
                <TouchableOpacity
                  key={timingOption.id}
                  style={[
                    styles.timingOption,
                    timing === timingOption.id && styles.timingOptionActive
                  ]}
                  onPress={() => setTiming(timingOption.id)}
                >
                  <Text style={[
                    styles.timingOptionText,
                    timing === timingOption.id && styles.timingOptionTextActive
                  ]}>
                    {timingOption.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plantilla de Mensaje</Text>
            <View style={styles.templateSelector}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateOption,
                    templateId === template.id && styles.templateOptionActive
                  ]}
                  onPress={() => setTemplateId(template.id)}
                >
                  <Text style={[
                    styles.templateOptionName,
                    templateId === template.id && styles.templateOptionNameActive
                  ]}>
                    {template.name}
                  </Text>
                  <Text style={[
                    styles.templateOptionContent,
                    templateId === template.id && styles.templateOptionContentActive
                  ]} numberOfLines={2}>
                    {template.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.inputLabel}>Activar Automatización</Text>
                <Text style={styles.switchDescription}>
                  La automatización se ejecutará según la configuración
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
                thumbColor={isActive ? Colors.light.primary : Colors.light.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  automationsList: {
    flex: 1,
  },
  automationsListContent: {
    padding: 16,
  },
  automationCard: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  automationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  automationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  automationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  automationInfo: {
    flex: 1,
  },
  automationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
  },
  automationDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  automationDetails: {
    marginBottom: 12,
    gap: 6,
  },
  automationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  automationDetailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  automationActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  automationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  automationActionText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalCancelButton: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  modalSaveButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
  },
  textInputText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  triggerSelector: {
    gap: 8,
  },
  triggerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  triggerOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  triggerOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  triggerOptionContent: {
    flex: 1,
  },
  triggerOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  triggerOptionNameActive: {
    color: Colors.light.surface,
  },
  triggerOptionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  triggerOptionDescriptionActive: {
    color: Colors.light.surface + 'CC',
  },
  timingSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timingOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timingOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  timingOptionTextActive: {
    color: Colors.light.surface,
  },
  templateSelector: {
    gap: 8,
  },
  templateOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  templateOptionActive: {
    backgroundColor: Colors.light.primary + '10',
    borderColor: Colors.light.primary,
  },
  templateOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  templateOptionNameActive: {
    color: Colors.light.primary,
  },
  templateOptionContent: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  templateOptionContentActive: {
    color: Colors.light.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});