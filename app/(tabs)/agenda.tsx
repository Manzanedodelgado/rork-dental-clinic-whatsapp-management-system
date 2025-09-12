import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

type Appointment = {
  id: string;
  time: string;
  patient: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
};

const mockAppointments: Appointment[] = [
  {
    id: '1',
    time: '09:00',
    patient: 'María García',
    service: 'Consulta General',
    status: 'confirmed',
  },
  {
    id: '2',
    time: '10:30',
    patient: 'Juan Pérez',
    service: 'Limpieza Dental',
    status: 'confirmed',
  },
  {
    id: '3',
    time: '14:00',
    patient: 'Ana López',
    service: 'Revisión',
    status: 'pending',
  },
  {
    id: '4',
    time: '15:30',
    patient: 'Carlos Ruiz',
    service: 'Tratamiento',
    status: 'confirmed',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return Colors.light.success;
    case 'pending':
      return Colors.light.warning;
    case 'cancelled':
      return Colors.light.error;
    default:
      return Colors.light.text;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

export default function AgendaScreen() {
  const [selectedDate] = useState(new Date());
  const insets = useSafeAreaInsets();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Calendar size={24} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Agenda</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Selector */}
        <View style={styles.dateSection}>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.changeDateButton}>
            <Text style={styles.changeDateText}>Cambiar fecha</Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>Citas del día</Text>
          
          {mockAppointments.length > 0 ? (
            <View style={styles.appointmentsList}>
              {mockAppointments.map((appointment) => (
                <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{appointment.time}</Text>
                  </View>
                  
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.patientName}>{appointment.patient}</Text>
                    <Text style={styles.serviceText}>{appointment.service}</Text>
                  </View>
                  
                  <View style={styles.appointmentStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(appointment.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(appointment.status) }
                      ]}>
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyStateText}>No hay citas programadas</Text>
              <Text style={styles.emptyStateSubtext}>para esta fecha</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Nueva Cita</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Ver Calendario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateSection: {
    marginBottom: 24,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  changeDateButton: {
    alignSelf: 'flex-start',
  },
  changeDateText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  appointmentsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  appointmentTime: {
    width: 60,
    marginRight: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  appointmentStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  quickActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.surface,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  secondaryButtonText: {
    color: Colors.light.tint,
  },
});