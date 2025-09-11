import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bot, 
  Settings, 
  Brain, 
  Clock, 
  MessageSquare,
  Zap,
  BookOpen,
  Save,
  Play,
  Pause
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';

const WORKING_DAYS = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
  { id: 'sunday', name: 'Domingo' },
];

const KNOWLEDGE_BASE_TOPICS = [
  'Implantología dental',
  'Estética dental',
  'Ortodoncia invisible',
  'Limpieza y prevención',
  'Endodoncia',
  'Periodoncia',
  'Cirugía oral',
  'Prótesis dentales',
  'Blanqueamiento dental',
  'Odontopediatría'
];

export default function AIScreen() {
  const { aiConfig, updateAIConfig } = useClinic();
  const [localConfig, setLocalConfig] = useState(aiConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const updateLocalConfig = (updates: Partial<typeof aiConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateAIConfig(localConfig);
    setHasChanges(false);
    Alert.alert('Guardado', 'La configuración de IA ha sido actualizada');
  };

  const handleTestAI = async () => {
    Alert.alert(
      'Prueba de IA',
      'Enviando mensaje de prueba...\n\n"Hola, ¿tienen disponibilidad para una cita esta semana?"',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            // Simulate AI response
            setTimeout(() => {
              Alert.alert(
                'Respuesta de IA',
                '¡Hola! Gracias por contactar con Rubio García Dental. Tenemos disponibilidad esta semana. ¿Qué tipo de tratamiento necesitas? Te ayudo a encontrar el mejor horario para ti.'
              );
            }, 1500);
          }
        }
      ]
    );
  };

  const toggleWorkingDay = (dayId: string) => {
    const currentDays = localConfig.workingHours.days;
    const updatedDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId];
    
    updateLocalConfig({
      workingHours: {
        ...localConfig.workingHours,
        days: updatedDays
      }
    });
  };

  const toggleKnowledgeBaseTopic = (topic: string) => {
    const currentTopics = localConfig.knowledgeBase;
    const updatedTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];
    
    updateLocalConfig({ knowledgeBase: updatedTopics });
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Bot color={localConfig.isEnabled ? Colors.light.success : Colors.light.textSecondary} size={24} />
        </View>
        <Text style={styles.statLabel}>Estado IA</Text>
        <Text style={[styles.statValue, { color: localConfig.isEnabled ? Colors.light.success : Colors.light.textSecondary }]}>
          {localConfig.isEnabled ? 'Activa' : 'Inactiva'}
        </Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <MessageSquare color={Colors.light.primary} size={24} />
        </View>
        <Text style={styles.statLabel}>Auto-Respuesta</Text>
        <Text style={[styles.statValue, { color: localConfig.autoReplyEnabled ? Colors.light.success : Colors.light.textSecondary }]}>
          {localConfig.autoReplyEnabled ? 'Activa' : 'Inactiva'}
        </Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <BookOpen color={Colors.light.warning} size={24} />
        </View>
        <Text style={styles.statLabel}>Conocimiento</Text>
        <Text style={styles.statValue}>
          {localConfig.knowledgeBase.length} temas
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asistente IA</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestAI}>
            <Play color={Colors.light.surface} size={16} />
            <Text style={styles.testButtonText}>Probar</Text>
          </TouchableOpacity>
          {hasChanges && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save color={Colors.light.surface} size={16} />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderStats()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración General</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activar IA</Text>
              <Text style={styles.settingDescription}>
                Habilita el asistente de inteligencia artificial
              </Text>
            </View>
            <Switch
              value={localConfig.isEnabled}
              onValueChange={(value) => updateLocalConfig({ isEnabled: value })}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
              thumbColor={localConfig.isEnabled ? Colors.light.primary : Colors.light.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Respuesta</Text>
              <Text style={styles.settingDescription}>
                Responde automáticamente a los mensajes de pacientes
              </Text>
            </View>
            <Switch
              value={localConfig.autoReplyEnabled}
              onValueChange={(value) => updateLocalConfig({ autoReplyEnabled: value })}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
              thumbColor={localConfig.autoReplyEnabled ? Colors.light.primary : Colors.light.textSecondary}
            />
          </View>
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalidad del Asistente</Text>
          <Text style={styles.sectionDescription}>
            Define cómo se comporta y responde el asistente IA
          </Text>
          
          <TextInput
            style={styles.textArea}
            value={localConfig.personality}
            onChangeText={(text) => updateLocalConfig({ personality: text })}
            placeholder="Describe la personalidad del asistente..."
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horario de Trabajo</Text>
          <Text style={styles.sectionDescription}>
            Define cuándo el asistente debe responder automáticamente
          </Text>
          
          <View style={styles.timeInputs}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Hora de inicio</Text>
              <TextInput
                style={styles.timeField}
                value={localConfig.workingHours.start}
                onChangeText={(text) => updateLocalConfig({
                  workingHours: { ...localConfig.workingHours, start: text }
                })}
                placeholder="09:00"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Hora de fin</Text>
              <TextInput
                style={styles.timeField}
                value={localConfig.workingHours.end}
                onChangeText={(text) => updateLocalConfig({
                  workingHours: { ...localConfig.workingHours, end: text }
                })}
                placeholder="18:00"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Días de trabajo</Text>
          <View style={styles.daysSelector}>
            {WORKING_DAYS.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  localConfig.workingHours.days.includes(day.id) && styles.dayButtonActive
                ]}
                onPress={() => toggleWorkingDay(day.id)}
              >
                <Text style={[
                  styles.dayButtonText,
                  localConfig.workingHours.days.includes(day.id) && styles.dayButtonTextActive
                ]}>
                  {day.name.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Knowledge Base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base de Conocimiento</Text>
          <Text style={styles.sectionDescription}>
            Selecciona los temas sobre los que el asistente puede responder
          </Text>
          
          <View style={styles.knowledgeGrid}>
            {KNOWLEDGE_BASE_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic}
                style={[
                  styles.knowledgeItem,
                  localConfig.knowledgeBase.includes(topic) && styles.knowledgeItemActive
                ]}
                onPress={() => toggleKnowledgeBaseTopic(topic)}
              >
                <Text style={[
                  styles.knowledgeItemText,
                  localConfig.knowledgeBase.includes(topic) && styles.knowledgeItemTextActive
                ]}>
                  {topic}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Training Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consejos de Entrenamiento</Text>
          
          <View style={styles.tipCard}>
            <Brain color={Colors.light.primary} size={20} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Personaliza las respuestas</Text>
              <Text style={styles.tipDescription}>
                Ajusta la personalidad para que refleje el tono de tu clínica
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Clock color={Colors.light.warning} size={20} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Configura horarios</Text>
              <Text style={styles.tipDescription}>
                Define cuándo debe responder automáticamente para evitar respuestas fuera de horario
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <BookOpen color={Colors.light.success} size={20} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Actualiza el conocimiento</Text>
              <Text style={styles.tipDescription}>
                Mantén actualizada la base de conocimiento con nuevos tratamientos y servicios
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  testButtonText: {
    color: Colors.light.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    color: Colors.light.surface,
    fontSize: 14,
    fontWeight: '600',
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
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: Colors.light.surface,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  timeField: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: Colors.light.surface,
  },
  knowledgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  knowledgeItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  knowledgeItemActive: {
    backgroundColor: Colors.light.primary + '20',
    borderColor: Colors.light.primary,
  },
  knowledgeItemText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  knowledgeItemTextActive: {
    color: Colors.light.primary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});