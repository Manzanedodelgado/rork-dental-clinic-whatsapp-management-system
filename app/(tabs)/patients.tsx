import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import { useAuth } from '@/hooks/useAuth';
import type { Patient } from '@/types';
import { Shield } from 'lucide-react-native';

export default function PatientsScreen() {
  const { patients } = useClinic();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPatient = () => {
    setShowAddModal(true);
  };

  const handlePatientPress = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  // Check permissions
  if (!hasPermission('patients') && !hasPermission('all')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Shield size={64} color={Colors.light.textSecondary} />
          <Text style={styles.noPermissionText}>
            No tienes permisos para acceder a esta sección
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeletePatient = (patientId: string) => {
    Alert.alert(
      'Eliminar Paciente',
      '¿Estás seguro de que quieres eliminar este paciente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement patient deletion
            console.log('Delete patient:', patientId);
          }
        }
      ]
    );
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handlePatientPress(item)}
    >
      <View style={styles.patientAvatar}>
        <Text style={styles.patientAvatarText}>
          {item.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <View style={styles.patientContact}>
          <Phone color={Colors.light.textSecondary} size={14} />
          <Text style={styles.patientPhone}>{item.phone}</Text>
        </View>
        {item.email && (
          <View style={styles.patientContact}>
            <Mail color={Colors.light.textSecondary} size={14} />
            <Text style={styles.patientEmail}>{item.email}</Text>
          </View>
        )}
        {item.lastVisit && (
          <View style={styles.patientContact}>
            <Calendar color={Colors.light.textSecondary} size={14} />
            <Text style={styles.patientLastVisit}>
              Última visita: {new Date(item.lastVisit).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.patientActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle color={Colors.light.primary} size={18} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeletePatient(item.id)}
        >
          <Trash2 color={Colors.light.error} size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPatientStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{patients.length}</Text>
        <Text style={styles.statLabel}>Total Pacientes</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {patients.filter(p => p.nextAppointment).length}
        </Text>
        <Text style={styles.statLabel}>Con Citas Programadas</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {patients.filter(p => {
            const lastVisit = p.lastVisit ? new Date(p.lastVisit) : null;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastVisit && lastVisit > thirtyDaysAgo;
          }).length}
        </Text>
        <Text style={styles.statLabel}>Visitas Recientes</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pacientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPatient}>
          <Plus color={Colors.light.surface} size={20} />
        </TouchableOpacity>
      </View>

      {renderPatientStats()}

      <View style={styles.searchContainer}>
        <Search color={Colors.light.textSecondary} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar pacientes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item, index) => {
          const key = item?.id || item?.phone || item?.email || `idx-${index}`;
          return String(key);
        }}
        style={styles.patientsList}
        contentContainerStyle={styles.patientsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </Text>
          </View>
        }
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(newPatient) => {
          // TODO: Implement patient creation
          console.log('Add patient:', newPatient);
          setShowAddModal(false);
        }}
      />

      {/* Patient Detail Modal */}
      <PatientDetailModal
        visible={showPatientModal}
        patient={selectedPatient}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
        onUpdate={(updatedPatient) => {
          // TODO: Implement patient update
          console.log('Update patient:', updatedPatient);
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
      />
    </SafeAreaView>
  );
}

// Add Patient Modal Component
function AddPatientModal({ 
  visible, 
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSave: (patient: Patient) => void; 
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'El nombre y teléfono son obligatorios');
      return;
    }

    const newPatient: Patient = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      appointments: []
    };

    onSave(newPatient);
    
    // Reset form
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nuevo Paciente</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+34 666 123 456"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="email@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas adicionales..."
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Patient Detail Modal Component
function PatientDetailModal({ 
  visible, 
  patient, 
  onClose, 
  onUpdate 
}: { 
  visible: boolean; 
  patient: Patient | null; 
  onClose: () => void; 
  onUpdate: (patient: Patient) => void; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (patient) {
      setName(patient.name);
      setPhone(patient.phone);
      setEmail(patient.email || '');
      setNotes(patient.notes || '');
    }
  }, [patient]);

  const handleSave = () => {
    if (!patient || !name.trim() || !phone.trim()) {
      Alert.alert('Error', 'El nombre y teléfono son obligatorios');
      return;
    }

    const updatedPatient: Patient = {
      ...patient,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onUpdate(updatedPatient);
    setIsEditing(false);
  };

  if (!patient) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cerrar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalles del Paciente</Text>
          <TouchableOpacity onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}>
            <Text style={styles.modalSaveButton}>
              {isEditing ? 'Guardar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.patientDetailHeader}>
            <View style={styles.patientDetailAvatar}>
              <Text style={styles.patientDetailAvatarText}>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={name}
              onChangeText={setName}
              editable={isEditing}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
              value={notes}
              onChangeText={setNotes}
              editable={isEditing}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          {patient.lastVisit && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Última Visita</Text>
              <Text style={styles.infoText}>
                {new Date(patient.lastVisit).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}

          {patient.nextAppointment && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Próxima Cita</Text>
              <Text style={styles.infoText}>
                {new Date(patient.nextAppointment).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  patientsList: {
    flex: 1,
  },
  patientsListContent: {
    padding: 16,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientAvatarText: {
    color: Colors.light.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  patientContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  patientEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  patientLastVisit: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  patientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  textInputDisabled: {
    backgroundColor: Colors.light.background,
    color: Colors.light.textSecondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  patientDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  patientDetailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDetailAvatarText: {
    color: Colors.light.surface,
    fontSize: 32,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});