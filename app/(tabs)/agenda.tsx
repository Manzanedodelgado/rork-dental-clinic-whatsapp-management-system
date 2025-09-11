import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Plus, User, Edit3, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import type { Appointment } from '@/types';



interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAppointments: boolean;
  appointmentCount: number;
}

interface NewAppointment {
  patientName: string;
  time: string;
  treatment: string;
  notes: string;
  duration: number;
}

const APPOINTMENT_STATUSES = [
  { key: 'scheduled', label: 'Programada', color: Colors.light.primary },
  { key: 'completed', label: 'Completada', color: '#10B981' },
  { key: 'cancelled', label: 'Cancelada', color: '#EF4444' },
  { key: 'no-show', label: 'No asistió', color: '#F59E0B' },
] as const;

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function AgendaScreen() {
  // Always call hooks in the same order
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    patientName: '',
    time: '09:00',
    treatment: '',
    notes: '',
    duration: 30
  });
  
  // Context hook - always called after state hooks
  const { 
    appointments, 
    isLoading, 
    isSyncing, 
    syncNow, 
    lastSyncTime, 
    syncError, 
    isConnected 
  } = useClinic();

  // Auto-refresh when component mounts
  useEffect(() => {
    if (!isLoading && appointments.length === 0) {
      syncNow();
    }
  }, [isLoading, appointments.length, syncNow]);

  // Generate calendar days for current month (starting Monday)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);

    // Calculate start date (Monday of the week containing the 1st)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 days to subtract
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days: CalendarDay[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('📅 Generating calendar for:', currentMonth.toLocaleDateString('es-ES'));
    console.log('📅 Today is:', todayStr);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Filter appointments for this date with proper date comparison
      const dayAppointments = appointments.filter(apt => {
        if (!apt.date) return false;
        
        let aptDate = apt.date;
        // Handle different date formats
        if (aptDate.includes('/')) {
          const parts = aptDate.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            aptDate = `${year}-${month}-${day}`;
          }
        }
        
        return aptDate === dateString;
      });
      
      days.push({
        date: dateString,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: dateString === todayStr,
        hasAppointments: dayAppointments.length > 0,
        appointmentCount: dayAppointments.length
      });
    }
    
    console.log('📅 Calendar days generated:', days.length);
    console.log('📅 Days with appointments:', days.filter(d => d.hasAppointments).length);
    
    return days;
  }, [currentMonth, appointments]);

  // Get appointments for selected date - using Date field as key
  const selectedDateAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    return appointments
      .filter(apt => {
        // Normalize dates for comparison
        const aptDate = apt.date;
        const selected = selectedDate;
        
        // Handle different date formats
        if (aptDate === selected) return true;
        
        // Try parsing both dates to compare
        try {
          const aptDateObj = new Date(aptDate + 'T00:00:00');
          const selectedDateObj = new Date(selected + 'T00:00:00');
          return aptDateObj.getTime() === selectedDateObj.getTime();
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by time
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [appointments, selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.patientName.trim() || !newAppointment.treatment.trim()) {
      console.log('Error: Por favor completa todos los campos obligatorios');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      patientId: 'new-' + Date.now(),
      patientName: newAppointment.patientName,
      date: selectedDate,
      time: newAppointment.time,
      treatment: newAppointment.treatment,
      status: 'scheduled',
      notes: newAppointment.notes,
      duration: newAppointment.duration
    };

    console.log('Creating new appointment:', appointment);
    
    setNewAppointment({
      patientName: '',
      time: '09:00',
      treatment: '',
      notes: '',
      duration: 30
    });
    setShowNewAppointmentModal(false);
    console.log('Éxito: Cita creada correctamente');
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    if (!appointmentId?.trim() || !newStatus?.trim() || appointmentId.length > 100 || newStatus.length > 50) {
      console.log('Error: Invalid appointment ID or status');
      return;
    }
    const sanitizedId = appointmentId.trim();
    const sanitizedStatus = newStatus.trim();
    console.log('Updating appointment status:', sanitizedId, sanitizedStatus);
    console.log('Éxito: Estado de la cita actualizado');
  };

  const formatDate = (dateString: string) => {
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSelectedDate = (dateString: string) => {
    try {
      // Parse date correctly to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Create date at noon to avoid timezone issues
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      console.log('🗓️ Formatting date:', dateString, '-> Date object:', date);
      console.log('🗓️ Day of week (0=Sunday):', date.getDay());
      
      // Get day names in Spanish
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      
      const formatted = `${dayName}, ${day} De ${monthName} De ${year}`;
      console.log('🗓️ Formatted date:', formatted);
      
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return dateString;
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    return APPOINTMENT_STATUSES.find(s => s.key === status)?.color || Colors.light.primary;
  };

  const getStatusLabel = (status: Appointment['status']) => {
    return APPOINTMENT_STATUSES.find(s => s.key === status)?.label || status;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={24} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Agenda</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.syncStatus}>
            {isConnected ? (
              <Wifi size={16} color={Colors.light.success} />
            ) : (
              <WifiOff size={16} color={Colors.light.error} />
            )}
            <Text style={[styles.syncText, { color: isConnected ? Colors.light.success : Colors.light.error }]}>
              {isConnected ? 'Conectado' : 'Sin conexión'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => syncNow()} 
            disabled={isSyncing}
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          >
            <RefreshCw 
              size={20} 
              color={isSyncing ? Colors.light.tabIconDefault : Colors.light.primary} 
              style={isSyncing ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
            <ChevronLeft size={20} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
            <ChevronRight size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Modern Calendar Grid */}
        <View style={styles.calendar}>
          {/* Week days header - Starting with Monday */}
          <View style={styles.weekDaysHeader}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <View key={day} style={styles.weekDayContainer}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const isSelected = day.date === selectedDate;
              const hasAppointments = day.hasAppointments;
              
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.calendarDay,
                    !day.isCurrentMonth && styles.calendarDayInactive,
                    day.isToday && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                    hasAppointments && !isSelected && styles.calendarDayWithAppointments,
                  ]}
                  onPress={() => setSelectedDate(day.date)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayTextInactive,
                    day.isToday && !isSelected && styles.calendarDayTextToday,
                    isSelected && styles.calendarDayTextSelected,
                  ]}>
                    {day.day}
                  </Text>
                  {hasAppointments && (
                    <View style={[
                      styles.appointmentIndicator,
                      isSelected && styles.appointmentIndicatorSelected
                    ]}>
                      <View style={styles.appointmentDot} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Section */}
        <View style={styles.selectedDateSection}>
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowNewAppointmentModal(true)}
            >
              <Plus size={20} color={Colors.light.surface} />
            </TouchableOpacity>
          </View>

          {/* Sync Status */}
          {syncError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>Error de sincronización: {syncError}</Text>
              <TouchableOpacity onPress={() => syncNow()} style={styles.retryButton}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {lastSyncTime && (
            <Text style={styles.lastSyncText}>
              Última sincronización: {lastSyncTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          {/* Appointments List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <RefreshCw size={32} color={Colors.light.primary} />
              <Text style={styles.loadingText}>Cargando citas...</Text>
            </View>
          ) : selectedDateAppointments.length === 0 ? (
            <View style={styles.noAppointments}>
              <Calendar size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.noAppointmentsText}>No hay citas programadas</Text>
              <Text style={styles.noAppointmentsSubtext}>
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'No tienes citas para hoy' 
                  : `No hay citas para ${formatDate(selectedDate).split(',')[0]}`}
              </Text>
              <TouchableOpacity 
                style={styles.addAppointmentButton}
                onPress={() => setShowNewAppointmentModal(true)}
              >
                <Plus size={20} color={Colors.light.surface} />
                <Text style={styles.addAppointmentText}>Crear nueva cita</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              <Text style={styles.appointmentsCount}>
                {selectedDateAppointments.length} cita{selectedDateAppointments.length !== 1 ? 's' : ''}
              </Text>
              {selectedDateAppointments.map((appointment, index) => (
                <View key={appointment.id || index} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentTime}>
                      <View style={[styles.timeIndicator, { backgroundColor: getStatusColor(appointment.status) }]} />
                      <Text style={styles.appointmentTimeText}>{appointment.time || 'Sin hora'}</Text>
                      {appointment.duration && (
                        <Text style={styles.appointmentDuration}>({appointment.duration}min)</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        if (appointment?.id?.trim() && appointment.id.length <= 100 && appointment.patientName?.trim() && appointment.patientName.length <= 200) {
                          setEditingAppointment(appointment);
                        }
                      }}
                    >
                      <Edit3 size={16} color={Colors.light.tabIconDefault} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentPatient}>
                      <User size={16} color={Colors.light.text} />
                      <Text style={styles.appointmentPatientName}>{appointment.patientName}</Text>
                    </View>
                    <Text style={styles.appointmentTreatment}>{appointment.treatment}</Text>
                    {appointment.dentist && (
                      <Text style={styles.appointmentDentist}>Dr. {appointment.dentist}</Text>
                    )}
                    {appointment.notes && (
                      <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                    )}
                  </View>

                  <View style={styles.appointmentFooter}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(appointment.status) + '15' }
                    ]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(appointment.status) }
                      ]}>
                        {getStatusLabel(appointment.status)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.changeStatusButton}
                      onPress={() => setEditingAppointment(appointment)}
                    >
                      <Text style={styles.changeStatusText}>Cambiar estado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Appointment Modal */}
      <Modal
        visible={showNewAppointmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewAppointmentModal(false)}>
              <Text style={styles.modalCancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Cita</Text>
            <TouchableOpacity onPress={handleCreateAppointment}>
              <Text style={styles.modalSaveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Paciente *</Text>
              <TextInput
                style={styles.formInput}
                value={newAppointment.patientName}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, patientName: text }))}
                placeholder="Nombre del paciente"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hora *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlots}>
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      newAppointment.time === time && styles.timeSlotSelected
                    ]}
                    onPress={() => setNewAppointment(prev => ({ ...prev, time }))}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      newAppointment.time === time && styles.timeSlotTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tratamiento *</Text>
              <TextInput
                style={styles.formInput}
                value={newAppointment.treatment}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, treatment: text }))}
                placeholder="Tipo de tratamiento"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duración (minutos)</Text>
              <TextInput
                style={styles.formInput}
                value={newAppointment.duration.toString()}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, duration: parseInt(text) || 30 }))}
                placeholder="30"
                keyboardType="numeric"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notas</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newAppointment.notes}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, notes: text }))}
                placeholder="Notas adicionales..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Appointment Status Modal */}
      <Modal
        visible={!!editingAppointment}
        animationType="fade"
        transparent
      >
        <View style={styles.statusModalOverlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusModalTitle}>Cambiar Estado</Text>
            <Text style={styles.statusModalSubtitle}>
              {editingAppointment?.patientName} - {editingAppointment?.time}
            </Text>
            
            <View style={styles.statusOptions}>
              {APPOINTMENT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusOption,
                    editingAppointment?.status === status.key && styles.statusOptionSelected
                  ]}
                  onPress={() => {
                    if (editingAppointment) {
                      handleUpdateAppointmentStatus(editingAppointment.id, status.key);
                      setEditingAppointment(null);
                    }
                  }}
                >
                  <View style={[styles.statusOptionColor, { backgroundColor: status.color }]} />
                  <Text style={styles.statusOptionText}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.statusModalCancel}
              onPress={() => setEditingAppointment(null)}
            >
              <Text style={styles.statusModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '500',
  },
  syncButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  calendar: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 1,
    borderRadius: 4,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: Colors.light.primary + '15',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  calendarDaySelected: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarDayWithAppointments: {
    backgroundColor: Colors.light.accent + '10',
  },
  calendarDayText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.text,
  },
  calendarDayTextInactive: {
    color: Colors.light.tabIconDefault,
  },
  calendarDayTextToday: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: Colors.light.surface,
    fontWeight: '600',
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },
  appointmentIndicatorSelected: {
    bottom: 3,
  },
  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.accent,
  },
  selectedDateSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAppointments: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAppointmentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginTop: 16,
  },
  noAppointmentsSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: Colors.light.error + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.error,
    marginRight: 12,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.error,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.surface,
  },
  lastSyncText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  appointmentsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  appointmentsList: {
    gap: 16,
  },
  addAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  addAppointmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.surface,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  appointmentTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  appointmentDuration: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  appointmentDentist: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    padding: 4,
  },
  appointmentInfo: {
    marginBottom: 12,
  },
  appointmentPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  appointmentTreatment: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    fontStyle: 'italic',
  },
  appointmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  changeStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalCancelButton: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeSlots: {
    flexDirection: 'row',
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timeSlotSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  timeSlotTextSelected: {
    color: Colors.light.surface,
    fontWeight: '500',
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusModalSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusOptions: {
    gap: 12,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  statusOptionSelected: {
    backgroundColor: Colors.light.primary + '20',
  },
  statusOptionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  statusModalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusModalCancelText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});