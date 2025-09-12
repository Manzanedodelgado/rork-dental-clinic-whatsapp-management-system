import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';

type ChartData = {
  labels: string[];
  values: number[];
  colors: string[];
};

const DataVisualization = () => {
  const { appointments, patients, todayAppointments } = useClinic();

  // Calculate treatment distribution
  const treatmentData = useMemo(() => {
    const treatmentCounts: Record<string, number> = {};
    
    appointments.forEach(appointment => {
      const treatment = appointment.treatment || 'Sin especificar';
      treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
    });

    // Sort by count and take top 5
    const sortedTreatments = Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const chartColors = [
      Colors.light.primary,
      Colors.light.primaryLight,
      Colors.light.highlight,
      Colors.light.accent,
      Colors.light.success,
    ];

    return {
      labels: sortedTreatments.map(([treatment]) => treatment),
      values: sortedTreatments.map(([_, count]) => count),
      colors: chartColors.slice(0, sortedTreatments.length),
    };
  }, [appointments]);

  // Calculate appointments by day of week
  const weekdayData = useMemo(() => {
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    appointments.forEach(appointment => {
      if (appointment.date) {
        const date = new Date(appointment.date);
        if (!isNaN(date.getTime())) {
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          weekdayCounts[dayOfWeek]++;
        }
      }
    });

    return {
      labels: weekdayNames,
      values: weekdayCounts,
      colors: Array(7).fill(Colors.light.primary),
    };
  }, [appointments]);

  // Calculate dentist distribution
  const dentistData = useMemo(() => {
    const dentistCounts: Record<string, number> = {};
    
    appointments.forEach(appointment => {
      const dentist = appointment.dentist || 'Sin asignar';
      dentistCounts[dentist] = (dentistCounts[dentist] || 0) + 1;
    });

    // Sort by count
    const sortedDentists = Object.entries(dentistCounts)
      .sort((a, b) => b[1] - a[1]);

    const chartColors = [
      Colors.light.primary,
      Colors.light.primaryLight,
      Colors.light.highlight,
      Colors.light.accent,
      Colors.light.success,
      Colors.light.warning,
    ];

    return {
      labels: sortedDentists.map(([dentist]) => dentist),
      values: sortedDentists.map(([_, count]) => count),
      colors: chartColors.slice(0, sortedDentists.length),
    };
  }, [appointments]);

  const renderBarChart = (data: ChartData, title: string) => {
    const maxValue = Math.max(...data.values, 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chart}>
          {data.labels.map((label, index) => (
            <View key={label} style={styles.barContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                  {label}
                </Text>
              </View>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${(data.values[index] / maxValue) * 100}%`,
                      backgroundColor: data.colors[index % data.colors.length],
                    }
                  ]}
                />
                <Text style={styles.barValue}>{data.values[index]}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChart = (data: ChartData, title: string) => {
    const total = data.values.reduce((sum, value) => sum + value, 0);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.pieChartContainer}>
          <View style={styles.pieChart}>
            {/* This is a simplified representation of a pie chart */}
            <View style={styles.pieChartPlaceholder}>
              <Text style={styles.pieChartTotal}>{total}</Text>
              <Text style={styles.pieChartTotalLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.pieChartLegend}>
            {data.labels.map((label, index) => (
              <View key={label} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { backgroundColor: data.colors[index % data.colors.length] }
                  ]} 
                />
                <Text style={styles.legendLabel} numberOfLines={1} ellipsizeMode="tail">
                  {label}: {data.values[index]} ({Math.round((data.values[index] / total) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{patients.length}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Citas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>

      {renderBarChart(weekdayData, 'Citas por día de la semana')}
      {renderPieChart(treatmentData, 'Distribución por tratamiento')}
      {renderBarChart(dentistData, 'Citas por dentista')}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: Colors.light.primary,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.primary,
  },
  chart: {
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    width: '30%',
    paddingRight: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  barWrapper: {
    flex: 1,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 24,
    borderRadius: 4,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieChart: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pieChartTotal: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pieChartTotalLabel: {
    color: 'white',
    fontSize: 12,
  },
  pieChartLegend: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
});

export default DataVisualization;