import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';

const PatientStats = () => {
  const { patients, appointments } = useClinic();

  // Calculate patients with upcoming appointments
  const patientsWithUpcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return patients.filter(patient => {
      if (patient.nextAppointment) {
        const nextAppointmentDate = new Date(patient.nextAppointment);
        return nextAppointmentDate >= today;
      }
      return false;
    });
  }, [patients]);

  // Calculate patients with recent visits
  const patientsWithRecentVisits = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return patients.filter(patient => {
      if (patient.lastVisit) {
        const lastVisitDate = new Date(patient.lastVisit);
        return lastVisitDate >= thirtyDaysAgo;
      }
      return false;
    });
  }, [patients]);

  // Calculate patients by appointment count
  const patientsByAppointmentCount = useMemo(() => {
    const counts = {
      'Sin citas': 0,
      '1 cita': 0,
      '2-3 citas': 0,
      '4-5 citas': 0,
      'Más de 5': 0,
    };
    
    patients.forEach(patient => {
      const appointmentCount = patient.appointments.length;
      
      if (appointmentCount === 0) {
        counts['Sin citas']++;
      } else if (appointmentCount === 1) {
        counts['1 cita']++;
      } else if (appointmentCount >= 2 && appointmentCount <= 3) {
        counts['2-3 citas']++;
      } else if (appointmentCount >= 4 && appointmentCount <= 5) {
        counts['4-5 citas']++;
      } else {
        counts['Más de 5']++;
      }
    });
    
    return counts;
  }, [patients]);

  // Calculate most common treatments
  const mostCommonTreatments = useMemo(() => {
    const treatmentCounts: Record<string, number> = {};
    
    appointments.forEach(appointment => {
      const treatment = appointment.treatment || 'Sin especificar';
      treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
    });
    
    return Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [appointments]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de Pacientes</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{patients.length}</Text>
            <Text style={styles.statLabel}>Total Pacientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{patientsWithUpcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>Con Citas Próximas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{patientsWithRecentVisits.length}</Text>
            <Text style={styles.statLabel}>Visitas Recientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appointments.length > 0 ? (appointments.length / patients.length).toFixed(1) : '0'}</Text>
            <Text style={styles.statLabel}>Citas por Paciente</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución por Número de Citas</Text>
        <View style={styles.barChartContainer}>
          {Object.entries(patientsByAppointmentCount).map(([label, count]) => (
            <View key={label} style={styles.barChartRow}>
              <Text style={styles.barChartLabel}>{label}</Text>
              <View style={styles.barChartBarContainer}>
                <View 
                  style={[
                    styles.barChartBar, 
                    { 
                      width: `${(count / patients.length) * 100}%`,
                      backgroundColor: Colors.light.primary,
                    }
                  ]}
                />
              </View>
              <Text style={styles.barChartCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tratamientos Más Comunes</Text>
        <View style={styles.treatmentsContainer}>
          {mostCommonTreatments.map(([treatment, count], index) => (
            <View key={treatment} style={styles.treatmentRow}>
              <View style={styles.treatmentRank}>
                <Text style={styles.treatmentRankText}>{index + 1}</Text>
              </View>
              <View style={styles.treatmentInfo}>
                <Text style={styles.treatmentName}>{treatment}</Text>
                <View style={styles.treatmentBarContainer}>
                  <View 
                    style={[
                      styles.treatmentBar, 
                      { 
                        width: `${(count / appointments.length) * 100}%`,
                        backgroundColor: index === 0 ? Colors.light.primary : 
                                        index === 1 ? Colors.light.primaryLight : 
                                        index === 2 ? Colors.light.accent : 
                                        index === 3 ? Colors.light.success : 
                                        Colors.light.warning,
                      }
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.treatmentCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Retención</Text>
        <View style={styles.retentionContainer}>
          <View style={styles.retentionItem}>
            <View style={styles.retentionCircle}>
              <Text style={styles.retentionValue}>
                {patients.length > 0 ? 
                  `${Math.round((patientsWithRecentVisits.length / patients.length) * 100)}%` : 
                  '0%'}
              </Text>
            </View>
            <Text style={styles.retentionLabel}>Pacientes Activos</Text>
          </View>
          <View style={styles.retentionItem}>
            <View style={styles.retentionCircle}>
              <Text style={styles.retentionValue}>
                {patients.length > 0 ? 
                  `${Math.round((patientsWithUpcomingAppointments.length / patients.length) * 100)}%` : 
                  '0%'}
              </Text>
            </View>
            <Text style={styles.retentionLabel}>Con Citas Futuras</Text>
          </View>
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
    textAlign: 'center',
  },
  barChartContainer: {
    marginTop: 8,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barChartLabel: {
    width: '25%',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  barChartBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barChartBar: {
    height: '100%',
  },
  barChartCount: {
    width: 30,
    textAlign: 'right',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  treatmentsContainer: {
    marginTop: 8,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  treatmentRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  treatmentRankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  treatmentBarContainer: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  treatmentBar: {
    height: '100%',
  },
  treatmentCount: {
    width: 30,
    textAlign: 'right',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  retentionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  retentionItem: {
    alignItems: 'center',
  },
  retentionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  retentionValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  retentionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

export default PatientStats;