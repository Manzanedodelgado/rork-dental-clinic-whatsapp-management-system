import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useClinic } from '@/hooks/useClinicStore';
import Colors from '@/constants/colors';
import { Check, AlertCircle, RefreshCw } from 'lucide-react-native';
import { SQLServerService } from '@/services/sqlServerService';

type SyncStatsType = {
  totalAppointments: number;
  lastSync: Date | null;
  newAppointmentsCount: number;
  updatedAppointmentsCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  serverInfo?: {
    server: string;
    database: string;
    backendAvailable: boolean;
  };
};

const SyncStatus = () => {
  const { 
    lastSyncTime, 
    syncError, 
    isConnected, 
    isSyncing, 
    syncNow
  } = useClinic();
  
  const [stats, setStats] = useState<SyncStatsType>({
    totalAppointments: 0,
    lastSync: null,
    newAppointmentsCount: 0,
    updatedAppointmentsCount: 0,
    connectionStatus: 'disconnected',
    serverInfo: {
      server: 'N/A',
      database: 'N/A',
      backendAvailable: false
    }
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const syncStats = await SQLServerService.getSyncStats();
        setStats(syncStats);
      } catch (error) {
        console.error('Error fetching sync stats:', error);
      }
    };
    
    fetchStats();
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estado de Sincronización</Text>
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={syncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <RefreshCw size={16} color="white" />
              <Text style={styles.syncButtonText}>Sincronizar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado:</Text>
          <View style={styles.statusValueContainer}>
            {isConnected ? (
              <>
                <Check size={16} color={Colors.light.success} />
                <Text style={[styles.statusValue, styles.statusConnected]}>Conectado</Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color={Colors.light.error} />
                <Text style={[styles.statusValue, styles.statusDisconnected]}>Desconectado</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Última sincronización:</Text>
          <Text style={styles.statusValue}>{formatDate(lastSyncTime)}</Text>
        </View>

        {syncError && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={Colors.light.error} />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Estadísticas de Sincronización</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAppointments}</Text>
            <Text style={styles.statLabel}>Citas Totales</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.newAppointmentsCount}</Text>
            <Text style={styles.statLabel}>Citas Nuevas</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.updatedAppointmentsCount}</Text>
            <Text style={styles.statLabel}>Actualizadas</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.connectionStatus === 'connected' ? 'Sí' : 'No'}</Text>
            <Text style={styles.statLabel}>Conexión</Text>
          </View>
        </View>

        {stats.serverInfo && (
          <View style={styles.serverInfo}>
            <Text style={styles.serverInfoLabel}>Servidor:</Text>
            <Text style={styles.serverInfoValue}>
              {stats.serverInfo.server}/{stats.serverInfo.database}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Ayuda de Sincronización</Text>
        <Text style={styles.helpText}>
          La aplicación sincroniza automáticamente los datos con el servidor SQL cada 5 minutos.
          Si necesita sincronizar manualmente, pulse el botón &quot;Sincronizar&quot;.
        </Text>
        <Text style={styles.helpText}>
          Si experimenta problemas de conexión, verifique que el servidor SQL esté en funcionamiento
          y que el script de sincronización esté ejecutándose correctamente.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  syncButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: Colors.light.primaryLight,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  statusValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusConnected: {
    color: Colors.light.success,
  },
  statusDisconnected: {
    color: Colors.light.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEECEC',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: Colors.light.error,
    marginLeft: 8,
    flex: 1,
  },
  statsCard: {
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
  statsTitle: {
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
  statItem: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
  },
  serverInfoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  serverInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
  },
  helpCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.light.text,
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SyncStatus;