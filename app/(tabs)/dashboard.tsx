import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';
import AppointmentStats from '@/components/AppointmentStats';
import PatientStats from '@/components/PatientStats';
import SyncStatus from '@/components/SyncStatus';
import { GoogleSheetsService } from '@/services/googleSheetsService';
import { Users, Calendar, RefreshCw, Activity, Database, Wifi, WifiOff, AlertCircle, Settings, Eye } from 'lucide-react-native';

type TabType = 'overview' | 'appointments' | 'patients' | 'sync';

// Add a new tab for real data overview
const RealDataOverview = () => {
  const { appointments, patients, todayAppointments } = useClinic();
  
  const statusCounts = appointments.reduce((acc, apt) => {
    const status = apt.status || 'Desconocido';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.realDataContainer}>
      <Text style={styles.sectionTitle}>Datos Importados de Google Sheets</Text>
      
      {appointments.length > 0 ? (
        <>
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>Distribución por Estado</Text>
            {Object.entries(statusCounts).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: GoogleSheetsService.getStatusColor(status) }]} />
                <Text style={styles.statusName}>{status}</Text>
                <Text style={styles.statusCount}>{count}</Text>
              </View>
            ))}
          </View>
          
          {todayAppointments.length > 0 && (
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Citas de Hoy ({todayAppointments.length})</Text>
              {todayAppointments.slice(0, 5).map((apt, index) => (
                <View key={apt.id || index} style={styles.appointmentRow}>
                  <Text style={styles.appointmentTime}>{apt.time}</Text>
                  <Text style={styles.appointmentPatient}>{apt.patientName}</Text>
                  <Text style={styles.appointmentTreatment}>{apt.treatment}</Text>
                </View>
              ))}
              {todayAppointments.length > 5 && (
                <Text style={styles.moreText}>... y {todayAppointments.length - 5} más</Text>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noDataCard}>
          <Database size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noDataTitle}>No hay datos importados</Text>
          <Text style={styles.noDataText}>
            Verifica la conexión con Google Sheets y la configuración de la API.
          </Text>
        </View>
      )}
    </View>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  
  const { 
    appointments,
    todayAppointments,
    newAppointments,
    updatedAppointments,
    lastSyncTime, 
    isSyncing,
    syncNow,
    isConnected,
    syncError,
    isLoading
  } = useClinic();
  
  const patients = appointments.reduce((acc, apt) => {
    if (!acc.find(p => p.id === apt.patientId)) {
      acc.push({
        id: apt.patientId,
        name: apt.patientName,
        phone: apt.telMovil || '',
        appointments: []
      });
    }
    return acc;
  }, [] as any[]);

  // Test connection on mount and log detailed info
  useEffect(() => {
    const logAppointmentData = () => {
      console.log('📊 Dashboard Data Summary:');
      console.log(`   📋 Total appointments: ${appointments.length}`);
      console.log(`   👥 Total patients: ${patients.length}`);
      console.log(`   📅 Today's appointments: ${todayAppointments.length}`);
      console.log(`   🆕 New appointments: ${newAppointments.length}`);
      console.log(`   🔄 Updated appointments: ${updatedAppointments.length}`);
      
      if (appointments.length > 0) {
        console.log('📋 Sample appointments:');
        appointments.slice(0, 3).forEach((apt, i) => {
          console.log(`   ${i + 1}. ${apt.patientName} - ${apt.date} ${apt.time} (${apt.treatment})`);
        });
      }
      
      if (todayAppointments.length > 0) {
        console.log('📅 Today\'s appointments:');
        todayAppointments.forEach((apt, i) => {
          console.log(`   ${i + 1}. ${apt.time} ${apt.patientName} - ${apt.treatment}`);
        });
      } else {
        console.log('📅 No appointments for today');
      }
    };
    
    logAppointmentData();
    
    // Test Google Sheets connection
    const testConnection = async () => {
      console.log('🔍 Dashboard: Testing Google Sheets connection...');
      const result = await GoogleSheetsService.testConnection();
      console.log('🔍 Dashboard: Connection test result:', result);
    };
    
    testConnection();
  }, [appointments, patients, todayAppointments, newAppointments, updatedAppointments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Dashboard: Manual refresh initiated');
      await syncNow();
    } catch (error) {
      console.error('❌ Dashboard: Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestConnection = async () => {
    console.log('🔍 Testing Google Sheets connection...');
    const result = await GoogleSheetsService.testConnection();
    
    console.log(result 
      ? '✅ Conexión exitosa con Google Sheets'
      : '❌ Error de conexión. Revisa la configuración.');
  };

  // Calculate comprehensive statistics
  const stats = {
    totalAppointments: appointments.length,
    totalPatients: patients.length,
    todayCount: todayAppointments.length,
    newCount: newAppointments.length,
    updatedCount: updatedAppointments.length,
    completedToday: todayAppointments.filter(apt => 
      apt.status?.toLowerCase().includes('finalizad')
    ).length,
    pendingToday: todayAppointments.filter(apt => 
      apt.status?.toLowerCase().includes('planificad')
    ).length,
    cancelledToday: todayAppointments.filter(apt => 
      apt.status?.toLowerCase().includes('cancelad')
    ).length,
    completedTotal: appointments.filter(apt => 
      apt.status?.toLowerCase().includes('finalizad')
    ).length,
    pendingTotal: appointments.filter(apt => 
      apt.status?.toLowerCase().includes('planificad')
    ).length
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <RealDataOverview />;
      case 'appointments':
        return <AppointmentStats />;
      case 'patients':
        return <PatientStats />;
      case 'sync':
        return <SyncStatus />;
      default:
        return <RealDataOverview />;
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    return lastSyncTime.toLocaleDateString('es-ES');
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Enhanced Header with Connection Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={28} color={Colors.light.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Panel de Control Clínico</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Wifi size={16} color={Colors.light.success} />
            ) : (
              <WifiOff size={16} color={Colors.light.error} />
            )}
            <Text style={[styles.connectionText, { color: isConnected ? Colors.light.success : Colors.light.error }]}>
              {isConnected ? 'Conectado' : 'Sin conexión'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={isSyncing || refreshing}
            style={[styles.refreshButton, (isSyncing || refreshing) && styles.refreshButtonDisabled]}
          >
            <RefreshCw 
              size={20} 
              color={(isSyncing || refreshing) ? Colors.light.tabIconDefault : Colors.light.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Real Data Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Database size={20} color={Colors.light.primary} />
          <Text style={styles.summaryTitle}>Datos Reales Importados</Text>
          <TouchableOpacity onPress={handleTestConnection} style={styles.testButton}>
            <Settings size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats.totalAppointments}</Text>
            <Text style={styles.summaryLabel}>Citas Importadas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats.totalPatients}</Text>
            <Text style={styles.summaryLabel}>Pacientes Únicos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats.todayCount}</Text>
            <Text style={styles.summaryLabel}>Citas Hoy</Text>
          </View>
        </View>
        
        {syncError && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={Colors.light.error} />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}
        
        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoText}>
            Última sincronización: {lastSyncTime ? lastSyncTime.toLocaleString('es-ES') : 'Nunca'}
          </Text>
          {(stats.newCount > 0 || stats.updatedCount > 0) && (
            <Text style={styles.syncChanges}>
              {stats.newCount > 0 && `${stats.newCount} nuevas`}
              {stats.newCount > 0 && stats.updatedCount > 0 && ', '}
              {stats.updatedCount > 0 && `${stats.updatedCount} modificadas`}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowDebugInfo(!showDebugInfo)}
          style={styles.debugToggle}
        >
          <Eye size={14} color={Colors.light.primary} />
          <Text style={styles.debugToggleText}>
            {showDebugInfo ? 'Ocultar' : 'Ver'} información técnica
          </Text>
        </TouchableOpacity>
        
        {showDebugInfo && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Google Sheets ID: 1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ</Text>
            <Text style={styles.debugText}>API Key: ✅ Configurada</Text>
            <Text style={styles.debugText}>Hoja: &quot;Hoja 1&quot;</Text>
            <Text style={styles.debugText}>Estado: {isConnected ? '✅ Conectado' : '❌ Desconectado'}</Text>
            <Text style={styles.debugText}>Sincronizando: {isSyncing ? '✅ Sí' : '❌ No'}</Text>
            <Text style={styles.debugText}>Cargando: {isLoading ? '✅ Sí' : '❌ No'}</Text>
          </View>
        )}
      </View>

      {/* Navegación por pestañas */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Database 
            size={20} 
            color={activeTab === 'overview' ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'overview' && styles.activeTabText
            ]}
          >
            Datos Reales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <Calendar 
            size={20} 
            color={activeTab === 'appointments' ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'appointments' && styles.activeTabText
            ]}
          >
            Citas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'patients' && styles.activeTab]}
          onPress={() => setActiveTab('patients')}
        >
          <Users 
            size={20} 
            color={activeTab === 'patients' ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'patients' && styles.activeTabText
            ]}
          >
            Pacientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sync' && styles.activeTab]}
          onPress={() => setActiveTab('sync')}
        >
          <RefreshCw 
            size={20} 
            color={activeTab === 'sync' ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'sync' && styles.activeTabText
            ]}
          >
            Sincronización
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    elevation: 4,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  syncInfoOld: {
    alignItems: 'flex-end',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  syncingBadge: {
    backgroundColor: 'rgba(43, 123, 192, 0.1)',
    borderColor: Colors.light.primary,
  },
  syncText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  syncingText: {
    color: Colors.light.primary,
  },
  syncingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  testButton: {
    padding: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error,
    flex: 1,
  },
  syncInfo: {
    marginBottom: 12,
  },
  syncInfoText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  syncChanges: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  debugToggleText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  debugInfo: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.light.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    elevation: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primary,
    backgroundColor: 'rgba(43, 123, 192, 0.08)',
  },
  tabText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  realDataContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  dataCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    width: 60,
  },
  appointmentPatient: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  appointmentTreatment: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noDataCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Dashboard;