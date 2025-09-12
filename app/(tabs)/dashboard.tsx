import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';
import DataVisualization from '@/components/DataVisualization';
import AppointmentStats from '@/components/AppointmentStats';
import PatientStats from '@/components/PatientStats';
import SyncStatus from '@/components/SyncStatus';
import { BarChart2, Users, Calendar, RefreshCw, Activity, TrendingUp } from 'lucide-react-native';

type TabType = 'overview' | 'appointments' | 'patients' | 'sync';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { lastSyncTime, isSyncing } = useClinic();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DataVisualization />;
      case 'appointments':
        return <AppointmentStats />;
      case 'patients':
        return <PatientStats />;
      case 'sync':
        return <SyncStatus />;
      default:
        return <DataVisualization />;
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

  return (
    <View style={styles.container}>
      {/* Header Principal */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={28} color={Colors.light.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Panel de Control Clínico</Text>
          </View>
        </View>
        <View style={styles.syncInfo}>
          <View style={[styles.syncBadge, isSyncing && styles.syncingBadge]}>
            <RefreshCw 
              size={14} 
              color={isSyncing ? Colors.light.primary : Colors.light.textSecondary} 
              style={isSyncing ? styles.syncingIcon : undefined}
            />
            <Text style={[styles.syncText, isSyncing && styles.syncingText]}>
              {isSyncing ? 'Sincronizando...' : formatLastSync()}
            </Text>
          </View>
        </View>
      </View>

      {/* Navegación por pestañas */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <TrendingUp 
            size={20} 
            color={activeTab === 'overview' ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'overview' && styles.activeTabText
            ]}
          >
            Resumen
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
  syncInfo: {
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
});

export default Dashboard;