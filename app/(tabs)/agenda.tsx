import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
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

type MonthMatrix = Array<Array<Date | null>>;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getMonthMatrix(year: number, month: number): MonthMatrix {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const firstDayIdx = (firstOfMonth.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastOfMonth.getDate();
  const matrix: MonthMatrix = [];
  let week: Array<Date | null> = new Array(7).fill(null);
  let dayCounter = 1;
  for (let i = 0; i < firstDayIdx; i += 1) week[i] = null;
  for (let cell = firstDayIdx; cell < 7; cell += 1) {
    week[cell] = new Date(year, month, dayCounter);
    dayCounter += 1;
  }
  matrix.push(week);
  while (dayCounter <= daysInMonth) {
    week = new Array(7).fill(null);
    for (let i = 0; i < 7 && dayCounter <= daysInMonth; i += 1) {
      week[i] = new Date(year, month, dayCounter);
      dayCounter += 1;
    }
    matrix.push(week);
  }
  return matrix;
}

function formatShort(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function useToday(): Date {
  const now = useMemo(() => startOfDay(new Date()), []);
  return now;
}

function CalendarDropdown({
  value,
  onChange,
}: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState<boolean>(false);
  const [viewYear, setViewYear] = useState<number>(value.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(value.getMonth());

  const matrix = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrev = useCallback(() => {
    console.log('CalendarDropdown.goPrev');
    const m = viewMonth - 1;
    if (m < 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth(m);
  }, [viewMonth]);

  const goNext = useCallback(() => {
    console.log('CalendarDropdown.goNext');
    const m = viewMonth + 1;
    if (m > 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth(m);
  }, [viewMonth]);

  const onSelect = useCallback((d: Date) => {
    console.log('CalendarDropdown.onSelect', d.toISOString());
    onChange(startOfDay(d));
    setOpen(false);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [onChange]);

  const monthLabel = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    [viewMonth, viewYear],
  );

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        testID="date-input"
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
        style={styles.inputBox}
      >
        <Text style={styles.inputText}>{formatShort(value)}</Text>
        <Calendar size={18} color={Colors.light.tabIconDefault} />
      </TouchableOpacity>

      {open && (
        <View testID="calendar-popover" style={styles.popover}>
          <View style={styles.popoverHeader}>
            <TouchableOpacity testID="prev-month" onPress={goPrev} style={styles.navBtn}>
              <ChevronLeft size={16} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity testID="next-month" onPress={goNext} style={styles.navBtn}>
              <ChevronRight size={16} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <Text key={d} style={styles.weekHeaderText}>{d}</Text>
            ))}
          </View>
          {matrix.map((week, i) => (
            <View key={`w-${i}`} style={styles.weekRow}>
              {week.map((cell, j) => {
                if (!cell) return <View key={`c-${i}-${j}`} style={styles.dayCellEmpty} />;
                const isSelected = startOfDay(cell).getTime() === startOfDay(value).getTime();
                return (
                  <TouchableOpacity
                    testID={`day-${cell.getDate()}`}
                    key={`c-${i}-${j}`}
                    onPress={() => onSelect(cell)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {cell.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(useToday());
  const insets = useSafeAreaInsets();

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Calendar size={24} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Agenda</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateSection}>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
          <CalendarDropdown value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>Citas del día</Text>
          
          {mockAppointments.length > 0 ? (
            <View style={styles.appointmentsList}>
              {mockAppointments.map((appointment) => (
                <TouchableOpacity
                  testID={`appointment-${appointment.id}`}
                  key={appointment.id}
                  style={styles.appointmentCard}
                >
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.patientName}>{appointment.patient}</Text>
                    <Text style={styles.serviceText}>{appointment.service}</Text>
                  </View>
                  <View style={styles.appointmentStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: (getStatusColor(appointment.status) ?? Colors.light.text) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(appointment.status) ?? Colors.light.text },
                        ]}
                      >
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
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  dropdownContainer: {
    zIndex: 10,
    maxWidth: 360,
    position: 'relative',
  },
  inputBox: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  popover: {
    position: 'absolute',
    top: 52,
    left: 0,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    width: 280,
    zIndex: 1000,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekHeaderText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  dayCellSelected: {
    backgroundColor: Colors.light.tint,
  },
  dayText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: Colors.light.surface,
    fontWeight: '700',
  },
  dayCellEmpty: {
    width: 36,
    height: 36,
    marginVertical: 3,
  },
  appointmentsSection: {
    marginBottom: 32,
    zIndex: 0,
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