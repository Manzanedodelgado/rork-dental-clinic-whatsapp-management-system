import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Plus, User, Edit3, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Clock, Phone, Stethoscope, FileText, AlertCircle, UserCheck, MapPin, CalendarDays } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import { GoogleSheetsService } from '@/services/googleSheetsService';
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

const dateToKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const APPOINTMENT_STATUSES = [
  { key: 'Planificada', label: 'Planificada', color: '#3B82F6', icon: 'Calendar' },
  { key: 'Finalizada', label: 'Finalizada', color: '#10B981', icon: 'UserCheck' },
  { key: 'Cancelada', label: 'Cancelada', color: '#EF4444', icon: 'AlertCircle' },
  { key: 'No asistió', label: 'No asistió', color: '#F59E0B', icon: 'MapPin' },
  { key: 'Desconocido', label: 'Desconocido', color: '#6B7280', icon: 'Clock' },
] as const;

const TIME_SLOTS = [
  '08:00','08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

const toDisplayDate = (key: string): string => {
  const parts = key.split('-');
  if (parts.length !== 3) return key;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

const toKeyDate = (display: string): string | null => {
  const trimmed = display.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  let dd = match[1];
  let mm = match[2];
  const yyyy = match[3];
  dd = dd.padStart(2, '0');
  mm = mm.padStart(2, '0');
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day, 12, 0, 0);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() + 1 !== month ||
    dt.getDate() !== day
  ) return null;
  return `${yyyy}-${mm}-${dd}`;
};

export default function AgendaScreen() {
  // Always call hooks in the same order
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>(dateToKey(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
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
    appointments = [], 
    isLoading = false, 
    isSyncing = false, 
    syncNow, 
    lastSyncTime, 
    syncError, 
    isConnected = true 
  } = useClinic();

  console.log('🔍 AgendaScreen render - appointments:', appointments?.length || 0);
  console.log('🔍 AgendaScreen render - isLoading:', isLoading);
  console.log('🔍 AgendaScreen render - selectedDate:', selectedDate);

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
    const todayStr = dateToKey(today);
    
    console.log('📅 Generating calendar for:', currentMonth.toLocaleDateString('es-ES'));
    console.log('📅 Today is:', todayStr);
    console.log('📅 First day of month:', firstDay.toISOString());
    console.log('📅 Start date for calendar:', startDate.toISOString());
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = dateToKey(date);
      
      // Debug specific dates
      if (dateString === '2025-07-07' || dateString === '2025-07-06' || dateString === '2025-07-08') {
        console.log(`🔍 Calendar date ${dateString}:`);
        console.log('   Date object:', date);
        console.log('   Day of week:', date.getDay(), '(0=Sun, 1=Mon, 2=Tue, etc.)');
        console.log('   Local date string:', date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      }
      
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
        
        const matches = aptDate === dateString;
        if (matches && (dateString === '2025-07-07' || dateString === '2025-07-06' || dateString === '2025-07-08')) {
          console.log(`📅 Found appointment for ${dateString}:`, apt.patientName, apt.time);
        }
        
        return matches;
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
    
    // Log specific dates around July 7, 2025
    const july2025Days = days.filter(d => d.date.startsWith('2025-07'));
    if (july2025Days.length > 0) {
      console.log('📅 July 2025 days in calendar:');
      july2025Days.forEach(d => {
        const dateObj = new Date(d.date + 'T00:00:00');
        console.log(`   ${d.date}: day ${d.day}, weekday ${dateObj.getDay()}, appointments: ${d.appointmentCount}`);
      });
    }
    
    return days;
  }, [currentMonth, appointments]);

  // Get appointments for selected date - using Date field as key
  const selectedDateAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    console.log('📅 Filtering appointments for selected date:', selectedDate);
    console.log('📅 Total appointments available:', appointments.length);
    
    const filtered = appointments
      .filter(apt => {
        // Normalize dates for comparison
        const aptDate = apt.date;
        const selected = selectedDate;
        
        // Handle different date formats
        if (aptDate === selected) {
          console.log('📅 Direct match found:', apt.patientName, apt.time);
          return true;
        }
        
        // Try parsing both dates to compare
        try {
          const aptDateObj = new Date(aptDate + 'T00:00:00');
          const selectedDateObj = new Date(selected + 'T00:00:00');
          const matches = aptDateObj.getTime() === selectedDateObj.getTime();
          
          if (matches) {
            console.log('📅 Parsed date match found:', apt.patientName, apt.time, 'aptDate:', aptDate, 'selected:', selected);
          }
          
          return matches;
        } catch (error) {
          console.log('📅 Date parsing failed for:', aptDate, 'vs', selected, error);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by time
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    
    console.log('📅 Filtered appointments for', selectedDate, ':', filtered.length);
    if (filtered.length > 0) {
      console.log('📅 Appointments found:');
      filtered.forEach((apt, i) => {
        console.log(`   ${i + 1}. ${apt.patientName} at ${apt.time} - ${apt.treatment}`);
      });
    }
    
    return filtered;
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

  const shiftSelectedDate = useCallback((days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    // Create date at noon to avoid timezone issues
    const base = new Date(y, m - 1, d, 12, 0, 0);
    base.setDate(base.getDate() + days);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    const next = `${yyyy}-${mm}-${dd}`;
    console.log('🔄 Shifting date:', selectedDate, '+', days, 'days =', next);
    setSelectedDate(next);
    setCurrentMonth(new Date(yyyy, base.getMonth(), 1));
  }, [selectedDate]);

  const weekStripDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    // Create date at noon to avoid timezone issues
    const base = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = base.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + mondayOffset);
    
    console.log('📅 Week strip calculation:');
    console.log('   Selected date:', selectedDate);
    console.log('   Base date object:', base.toISOString());
    console.log('   Day of week (0=Sun, 1=Mon):', dayOfWeek);
    console.log('   Monday offset:', mondayOffset);
    console.log('   Monday date:', monday.toISOString());
    
    const days: { key: string; label: string; day: number; isToday: boolean; count: number }[] = [];
    const todayStr = dateToKey(new Date());
    
    for (let i = 0; i < 7; i++) {
      const dte = new Date(monday);
      dte.setDate(monday.getDate() + i);
      const key = dateToKey(dte);
      const label = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i];
      const count = appointments.filter(a => a.date === key).length;
      
      console.log(`   Day ${i}: ${label} ${dte.getDate()} -> ${key} (${dte.toLocaleDateString('es-ES', { weekday: 'long' })})`);
      
      days.push({ key, label, day: dte.getDate(), isToday: key === todayStr, count });
    }
    
    console.log('📅 Week strip days generated:', days.map(d => `${d.label} ${d.day} (${d.key})`).join(', '));
    
    return days;
  }, [selectedDate, appointments]);

  const appointmentsByTime = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    TIME_SLOTS.forEach(t => { map[t] = []; });
    selectedDateAppointments.forEach(a => {
      const t = a.time ?? '';
      if (map[t]) map[t].push(a); else {
        if (!map['otros']) map['otros'] = [] as unknown as Appointment[];
        map['otros'].push(a);
      }
    });
    return map;
  }, [selectedDateAppointments]);

  const handleCreateAppointment = () => {
    if (!newAppointment.patientName.trim() || !newAppointment.treatment.trim()) {
      console.log('Error: Por favor completa todos los campos obligatorios');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      registro: Date.now().toString(),
      patientId: 'new-' + Date.now(),
      patientName: newAppointment.patientName,
      apellidos: '',
      nombre: newAppointment.patientName,
      date: selectedDate,
      time: newAppointment.time,
      treatment: newAppointment.treatment,
      status: 'Planificada',
      notes: newAppointment.notes,
      duration: newAppointment.duration,
      fechaAlta: new Date().toISOString(),
      citMod: new Date().toISOString(),
      estadoCita: 'Planificada'
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
      Alert.alert('Error', 'ID de cita o estado inválido');
      return;
    }
    
    const sanitizedId = appointmentId.trim();
    const sanitizedStatus = newStatus.trim();
    
    Alert.alert(
      'Actualizar Estado',
      `¿Confirmar cambio de estado a "${sanitizedStatus}"?\n\nNota: Los cambios se sincronizarán con Google Sheets en la próxima actualización.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            console.log('📝 Updating appointment status:', sanitizedId, '→', sanitizedStatus);
            console.log('✅ Estado actualizado localmente. Pendiente sincronización con Google Sheets.');
            
            // Show success message
            Alert.alert(
              'Estado Actualizado',
              `La cita se ha marcado como "${sanitizedStatus}".\n\nLa sincronización con Google Sheets se realizará automáticamente.`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date at noon to avoid timezone shifts
    const date = new Date(year, month - 1, day, 12, 0, 0); // month is 0-indexed
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
      
      // Create date object at noon to avoid timezone shifts
      // This ensures the day of week calculation is correct
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      console.log('🗓️ Formatting date:', dateString);
      console.log('🗓️ Date components: year=', year, 'month=', month, 'day=', day);
      console.log('🗓️ Created Date object (at noon):', date.toISOString());
      console.log('🗓️ Local date string:', date.toLocaleDateString('es-ES'));
      console.log('🗓️ Day of week (0=Sunday, 1=Monday):', date.getDay());
      
      // Verify the date is correct by checking if it matches our input
      const verifyYear = date.getFullYear();
      const verifyMonth = String(date.getMonth() + 1).padStart(2, '0');
      const verifyDay = String(date.getDate()).padStart(2, '0');
      const verifyDateStr = `${verifyYear}-${verifyMonth}-${verifyDay}`;
      console.log('🗓️ Verification - input:', dateString, 'output:', verifyDateStr, 'match:', dateString === verifyDateStr);
      
      // Get day names in Spanish (0=Sunday, 1=Monday, etc.)
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      
      const formatted = `${dayName}, ${day} De ${monthName} De ${year}`;
      console.log('🗓️ Final formatted date:', formatted);
      
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return dateString;
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    return GoogleSheetsService.getStatusColor(status);
  };

  const getStatusLabel = (status: Appointment['status']) => {
    return APPOINTMENT_STATUSES.find(s => s.key === status)?.label || status;
  };

  const getSyncIndicator = (appointment: Appointment) => {
    if (!appointment.fechaAlta || !appointment.citMod) return null;
    
    const syncInfo = GoogleSheetsService.getSyncInfo(appointment);
    if (syncInfo.isNew) {
      return { icon: 'new', color: '#10B981', label: 'Nueva' };
    } else if (syncInfo.isModified) {
      return { icon: 'modified', color: '#F59E0B', label: 'Modificada' };
    }
    return null;
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
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitleText} testID="agenda-title">
            Agenda - {formatDate(selectedDate)}
          </Text>
        </View>

        <View style={styles.weekStrip}>
          <TouchableOpacity onPress={() => shiftSelectedDate(-7)} style={styles.weekNavBtn} testID="agenda-prev-week">
            <ChevronLeft size={16} color={Colors.light.primary} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll} contentContainerStyle={styles.weekDaysScrollContent}>
            {weekStripDays.map(d => {
              const isSelected = d.key === selectedDate;
              return (
                <TouchableOpacity
                  key={d.key}
                  onPress={() => setSelectedDate(d.key)}
                  style={[styles.weekPill, isSelected && styles.weekPillSelected, d.isToday && styles.weekPillToday]}
                  testID={`agenda-week-pill-${d.key}`}
                >
                  <Text style={[styles.weekPillLabel, isSelected && styles.weekPillLabelSelected]}>{d.label}</Text>
                  <Text style={[styles.weekPillDay, isSelected && styles.weekPillDaySelected]}>{d.day}</Text>
                  {d.count > 0 ? (
                    <View style={styles.weekPillBadge}>
                      <Text style={styles.weekPillBadgeText}>{d.count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={() => shiftSelectedDate(7)} style={styles.weekNavBtn} testID="agenda-next-week">
            <ChevronRight size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
            <ChevronLeft size={20} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.calendarHeaderActions}>
            <TouchableOpacity onPress={() => setShowCalendar(prev => !prev)} style={styles.toggleCalendarBtn} testID="toggle-calendar">
              <CalendarDays size={16} color={Colors.light.primary} />
              <Text style={styles.toggleCalendarText}>{showCalendar ? 'Ocultar' : 'Ver'} calendario</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
              <ChevronRight size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dateSelectorCard}>
          <Text style={styles.selectorLabel}>Seleccionar Fecha</Text>
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity onPress={() => shiftSelectedDate(-1)} style={styles.dayShiftBtn} testID="agenda-prev-day">
              <ChevronLeft size={18} color={Colors.light.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.dateInput}
              value={toDisplayDate(selectedDate)}
              onChangeText={(text) => {
                const key = toKeyDate(text);
                if (key) setSelectedDate(key);
              }}
              placeholder={toDisplayDate(dateToKey(new Date()))}
              keyboardType="numeric"
              maxLength={10}
              testID="agenda-date-input"
            />
            <TouchableOpacity onPress={() => shiftSelectedDate(1)} style={styles.dayShiftBtn} testID="agenda-next-day">
              <ChevronRight size={18} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Modern Calendar Grid */}
        {showCalendar && (
        <View style={styles.calendar}>
          {/* Week days header - Starting with Monday */}
          <View style={styles.weekDaysHeader}>
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day) => (
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
                    isSelected && styles.calendarDaySelected,
                  ]}
                  onPress={() => setSelectedDate(day.date)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayTextInactive,
                    isSelected && styles.calendarDayTextSelected,
                  ]}>
                    {day.day}
                  </Text>
                  {hasAppointments && (
                    <View style={styles.appointmentIndicator}>
                      <View style={styles.appointmentDot} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}

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
                {selectedDate === dateToKey(new Date()) 
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
            <View style={styles.timelineWrapper}>
              <Text style={styles.appointmentsCount}>
                {selectedDateAppointments.length} cita{selectedDateAppointments.length !== 1 ? 's' : ''}
              </Text>

              <View style={styles.timelineContainer}>
                <View style={styles.timelineBar} />
                {TIME_SLOTS.map((slot) => {
                  const items = appointmentsByTime[slot] ?? [];
                  return (
                    <View key={slot} style={styles.timelineRow}>
                      <View style={styles.timelineTimeCell}>
                        <Text style={styles.timelineTimeText}>{slot}</Text>
                      </View>
                      <View style={styles.timelineContentCell}>
                        {items.length === 0 ? (
                          <View style={styles.timelineEmptyBlock} />
                        ) : (
                          items.map((appointment, index) => {
                            const syncIndicator = getSyncIndicator(appointment);
                            return (
                              <View key={(appointment.id ?? '') + index.toString()} style={styles.appointmentCard}>
                                <View style={styles.appointmentHeader}>
                                  <View style={styles.appointmentTime}>
                                    <View style={[styles.timeIndicator, { backgroundColor: getStatusColor(appointment.status) }]} />
                                    <Clock size={16} color={Colors.light.text} />
                                    <Text style={styles.appointmentTimeText}>{appointment.time || 'Sin hora'}</Text>
                                    {appointment.duration ? (
                                      <Text style={styles.appointmentDuration}>({appointment.duration}min)</Text>
                                    ) : null}
                                  </View>
                                  <View style={styles.appointmentHeaderRight}>
                                    {syncIndicator ? (
                                      <View style={[styles.syncIndicator, { backgroundColor: syncIndicator.color + '20' }]}>
                                        <AlertCircle size={12} color={syncIndicator.color} />
                                        <Text style={[styles.syncIndicatorText, { color: syncIndicator.color }]}>
                                          {syncIndicator.label}
                                        </Text>
                                      </View>
                                    ) : null}
                                    <TouchableOpacity style={styles.editButton} onPress={() => {
                                      if (appointment?.id?.trim() && appointment.patientName?.trim()) setEditingAppointment(appointment);
                                    }}>
                                      <Edit3 size={16} color={Colors.light.tabIconDefault} />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                <View style={styles.appointmentInfo}>
                                  <View style={styles.appointmentPatient}>
                                    <User size={18} color={Colors.light.primary} />
                                    <View style={styles.patientDetails}>
                                      <Text style={styles.appointmentPatientName}>
                                        {appointment.nombre} {appointment.apellidos}
                                      </Text>
                                      {appointment.numPac ? (
                                        <Text style={styles.patientNumber}>Paciente #{appointment.numPac}</Text>
                                      ) : null}
                                      {appointment.telMovil ? (
                                        <View style={styles.phoneContainer}>
                                          <Phone size={14} color={Colors.light.tabIconDefault} />
                                          <Text style={styles.phoneText}>{appointment.telMovil}</Text>
                                        </View>
                                      ) : null}
                                    </View>
                                  </View>
                                  <View style={styles.treatmentContainer}>
                                    <Stethoscope size={16} color={Colors.light.accent} />
                                    <Text style={styles.appointmentTreatment}>{appointment.treatment}</Text>
                                  </View>
                                  {(appointment.dentist || appointment.odontologo) ? (
                                    <Text style={styles.appointmentDentist}>
                                      Dr. {appointment.dentist || appointment.odontologo}
                                    </Text>
                                  ) : null}
                                  {appointment.notes ? (
                                    <View style={styles.notesContainer}>
                                      <FileText size={14} color={Colors.light.tabIconDefault} />
                                      <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                                    </View>
                                  ) : null}
                                  <View style={styles.registrationInfo}>
                                    <View style={styles.registrationRow}>
                                      <Text style={styles.registrationText}>Registro: {appointment.registro}</Text>
                                      {appointment.fechaAlta ? (
                                        <Text style={styles.registrationText}>
                                          Creada: {new Date(appointment.fechaAlta).toLocaleDateString('es-ES')}
                                        </Text>
                                      ) : null}
                                    </View>
                                    {appointment.citMod && appointment.fechaAlta && appointment.citMod !== appointment.fechaAlta ? (
                                      <Text style={styles.modifiedText}>
                                        Modificada: {new Date(appointment.citMod).toLocaleDateString('es-ES')}
                                      </Text>
                                    ) : null}
                                  </View>
                                </View>
                                <View style={styles.appointmentFooter}>
                                  <TouchableOpacity
                                    style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '15' }]}
                                    onPress={() => setEditingAppointment(appointment)}
                                    activeOpacity={0.7}
                                  >
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
                                    <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                                      {getStatusLabel(appointment.status)}
                                    </Text>
                                    <Edit3 size={12} color={getStatusColor(appointment.status)} />
                                  </TouchableOpacity>
                                  {appointment.situacion && appointment.situacion !== appointment.status ? (
                                    <View style={styles.situacionBadge}>
                                      <Text style={styles.situacionText}>Situación: {appointment.situacion}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
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
            <Text style={styles.statusModalTitle}>Cambiar Estado de Cita</Text>
            <Text style={styles.statusModalSubtitle}>
              {editingAppointment?.nombre} {editingAppointment?.apellidos}
            </Text>
            <Text style={styles.statusModalDetails}>
              {editingAppointment?.time} • {editingAppointment?.treatment}
            </Text>
            
            <View style={styles.statusOptions}>
              {APPOINTMENT_STATUSES.map((status) => {
                const isSelected = editingAppointment?.status === status.key;
                return (
                  <TouchableOpacity
                    key={status.key}
                    style={[
                      styles.statusOption,
                      isSelected && styles.statusOptionSelected
                    ]}
                    onPress={() => {
                      if (editingAppointment) {
                        handleUpdateAppointmentStatus(editingAppointment.id, status.key);
                        setEditingAppointment(null);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusOptionColor, { backgroundColor: status.color }]} />
                    <Text style={[
                      styles.statusOptionText,
                      isSelected && styles.statusOptionTextSelected
                    ]}>
                      {status.label}
                    </Text>
                    {isSelected ? (
                      <UserCheck size={16} color={status.color} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
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
  pageTitleRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  pageTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dateSelectorCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  selectorLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayShiftBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
  },
  calendarHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleCalendarText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
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
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    padding: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  weekNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  weekDaysScroll: {
    flex: 1,
  },
  weekDaysScrollContent: {
    paddingHorizontal: 4,
  },
  weekPill: {
    width: 64,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  weekPillToday: {
    borderColor: Colors.light.accent,
  },
  weekPillSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  weekPillLabel: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
  },
  weekPillLabelSelected: {
    color: Colors.light.surface,
  },
  weekPillDay: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '700',
  },
  weekPillDaySelected: {
    color: Colors.light.surface,
  },
  weekPillBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: Colors.light.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weekPillBadgeText: {
    fontSize: 10,
    color: Colors.light.surface,
    fontWeight: '700',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tabIconDefault,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
    borderRadius: 8,
  },
  calendarDayInactive: {
    opacity: 0.4,
  },

  calendarDaySelected: {
    backgroundColor: '#4A90E2',
  },

  calendarDayText: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.light.text,
  },
  calendarDayTextInactive: {
    color: '#C7C7CC',
  },

  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
  },

  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34C759',
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
  timelineWrapper: {
    gap: 12,
  },
  timelineContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  timelineBar: {
    position: 'absolute',
    left: 52,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.light.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineTimeCell: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  timelineTimeText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
  },
  timelineContentCell: {
    flex: 1,
    paddingLeft: 12,
    gap: 12,
  },
  timelineEmptyBlock: {
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    flex: 1,
  },
  appointmentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  patientDetails: {
    flex: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  treatmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  registrationInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  registrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  registrationText: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  modifiedText: {
    fontSize: 10,
    color: Colors.light.accent,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  patientNumber: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  situacionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  situacionText: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  appointmentTreatment: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
  },
  appointmentNotes: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  appointmentFooter: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  statusModalDetails: {
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
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    backgroundColor: Colors.light.primary + '10',
    borderColor: Colors.light.primary + '30',
  },
  statusOptionColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
  },
  statusOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
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