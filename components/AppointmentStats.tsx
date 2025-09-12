import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';

const AppointmentStats = () => {
  const { appointments, todayAppointments, newAppointments, updatedAppointments } = useClinic();

  // Calculate status distribution
  const statusStats = useMemo(() => {
    const statusCounts = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      'no-show': 0,
    };

    appointments.forEach(appointment => {
      if (appointment.status in statusCounts) {
        statusCounts[appointment.status as keyof typeof statusCounts]++;
      }
    });

    return statusCounts;
  }, [appointments]);

  // Calculate monthly distribution
  const monthlyStats = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    appointments.forEach(appointment => {
      if (appointment.date) {
        const date = new Date(appointment.date);
        if (!isNaN(date.getTime())) {
          const monthIndex = date.getMonth();
          const monthName = monthNames[monthIndex];
          monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
        }
      }
    });

    return Object.entries(monthCounts)
      .sort((a, b) => {
        const monthA = monthNames.indexOf(a[0]);
        const monthB = monthNames.indexOf(b[0]);
        return monthA - monthB;
      });
  }, [appointments]);

  // Calculate time slot distribution
  const timeSlotStats = useMemo(() => {
    const timeSlots = {
      'Mañana (8-12)': 0,
      'Mediodía (12-15)': 0,
      'Tarde (15-19)': 0,
      'Noche (19-21)': 0,
    };

    appointments.forEach(appointment => {
      if (appointment.time) {
        const [hours] = appointment.time.split(':').map(Number);
        
        if (hours >= 8 && hours < 12) {
          timeSlots['Mañana (8-12)']++;
        } else if (hours >= 12 && hours < 15) {
          timeSlots['Mediodía (12-15)']++;
        } else if (hours >= 15 && hours < 19) {
          timeSlots['Tarde (15-19)']++;
        } else if (hours >= 19 && hours < 21) {
          timeSlots['Noche (19-21)']++;
        }
      }
    });

    return timeSlots;
  }, [appointments]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de Citas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{newAppointments.length}</Text>
            <Text style={styles.statLabel}>Nuevas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{updatedAppointments.length}</Text>
            <Text style={styles.statLabel}>Actualizadas</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Citas</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statusCard, styles.scheduledCard]}>
            <Text style={styles.statusValue}>{statusStats.scheduled}</Text>
            <Text style={styles.statusLabel}>Programadas</Text>
          </View>
          <View style={[styles.statusCard, styles.completedCard]}>
            <Text style={styles.statusValue}>{statusStats.completed}</Text>
            <Text style={styles.statusLabel}>Completadas</Text>
          </View>
          <View style={[styles.statusCard, styles.cancelledCard]}>
            <Text style={styles.statusValue}>{statusStats.cancelled}</Text>
            <Text style={styles.statusLabel}>Canceladas</Text>
          </View>
          <View style={[styles.statusCard, styles.noShowCard]}>
            <Text style={styles.statusValue}>{statusStats['no-show']}</Text>
            <Text style={styles.statusLabel}>No asistió</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución por Horario</Text>
        <View style={styles.timeSlotContainer}>
          {Object.entries(timeSlotStats).map(([slot, count]) => (
            <View key={slot} style={styles.timeSlotRow}>
              <Text style={styles.timeSlotLabel}>{slot}</Text>
              <View style={styles.timeSlotBarContainer}>
                <View 
                  style={[
                    styles.timeSlotBar, 
                    { 
                      width: `${(count / appointments.length) * 100}%`,
                      backgroundColor: Colors.light.primary,
                    }
                  ]}
                />
              </View>
              <Text style={styles.timeSlotCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución Mensual</Text>
        <View style={styles.monthlyContainer}>
          {monthlyStats.map(([month, count]) => (
            <View key={month} style={styles.monthlyItem}>
              <Text style={styles.monthName}>{month}</Text>
              <Text style={styles.monthCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  scheduledCard: {
    backgroundColor: Colors.light.primary,
  },
  completedCard: {
    backgroundColor: Colors.light.success,
  },
  cancelledCard: {
    backgroundColor: Colors.light.error,
  },
  noShowCard: {
    backgroundColor: Colors.light.warning,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  timeSlotContainer: {
    marginTop: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotLabel: {
    width: '30%',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  timeSlotBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeSlotBar: {
    height: '100%',
  },
  timeSlotCount: {
    width: 30,
    textAlign: 'right',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  monthlyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthlyItem: {
    width: '30%',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  monthName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  monthCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 4,
  },
});

export default AppointmentStats;