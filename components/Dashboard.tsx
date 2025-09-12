import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';
import DataVisualization from './DataVisualization';
import AppointmentStats from './AppointmentStats';
import PatientStats from './PatientStats';
import SyncStatus from './SyncStatus';
import { BarChart2, Users, Calendar, RefreshCw } from 'lucide-react-native';

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
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Control</Text>
        <View style={styles.syncInfo}>
          <Text style={styles.syncText}>
            {isSyncing ? 'Sincronizando...' : `Última sync: ${formatLastSync()}`}
          </Text>
          {isSyncing && <RefreshCw size={16} color={Colors.light.primary} style={styles.syncIcon} />}
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <BarChart2 
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
            Sync
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  syncIcon: {
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default Dashboard;