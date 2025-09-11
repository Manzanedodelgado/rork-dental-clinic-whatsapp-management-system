import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  Clock, 
  Phone,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Database,
  Plus,
  Edit3,
  Activity,
  CheckCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import { SQLServerService } from '@/services/sqlServerService';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const { 
    todayAppointments, 
    unreadMessagesCount, 
    patients, 
    conversations,
    isLoading,
    lastSyncTime,
    syncError,
    isConnected,
    isSyncing,
    syncNow,
    newAppointments,
    updatedAppointments
  } = useClinic();
  
  const [syncStatsData, setSyncStatsData] = useState<{ totalAppointments: number }>({ totalAppointments: 0 });
  
  // Get sync stats
  React.useEffect(() => {
    const getSyncStats = async () => {
      try {
        const stats = await SQLServerService.getSyncStats();
        setSyncStatsData({ totalAppointments: stats.totalAppointments });
      } catch (error) {
        console.error('Error getting sync stats:', error);
      }
    };
    getSyncStats();
  }, []);

  const handleVerifySync = async () => {
    setIsVerifying(true);
    try {
      const result = await SQLServerService.verifySyncStatus();
      
      Alert.alert(
        'Estado de Sincronización SQL',
        result.message + '\n\n' +
        `📊 Total citas: ${result.details.totalAppointments}\n` +
        `🆕 Citas nuevas: ${result.details.newAppointments}\n` +
        `🔄 Citas actualizadas: ${result.details.updatedAppointments}\n` +
        `⏰ Última sync: ${result.details.lastSync || 'Nunca'}\n` +
        `🔗 Estado: ${result.details.connectionStatus}`,
        [
          { text: 'OK' },
          { 
            text: 'Sincronizar Ahora', 
            onPress: () => syncNow(),
            style: 'default'
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error de Verificación',
        `No se pudo verificar el estado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const stats = [
    {
      id: 'appointments',
      title: 'Citas Hoy',
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: Colors.light.primary,
      bgColor: Colors.light.primary + '15',
    },
    {
      id: 'messages',
      title: 'Mensajes Pendientes',
      value: unreadMessagesCount.toString(),
      icon: MessageSquare,
      color: Colors.light.accent,
      bgColor: Colors.light.accent + '15',
    },
    {
      id: 'patients',
      title: 'Total Pacientes',
      value: patients.length.toString(),
      icon: Users,
      color: Colors.light.success,
      bgColor: Colors.light.success + '15',
    },
    {
      id: 'conversations',
      title: 'Conversaciones Activas',
      value: conversations.filter(c => c.unreadCount > 0).length.toString(),
      icon: Phone,
      color: Colors.light.warning,
      bgColor: Colors.light.warning + '15',
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Image 
                source={{ uri: 'https://r2-pub.rork.com/generated-images/b75c13da-045f-47f5-9c03-03d09b6824f9.png' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.clinicInfo}>
              <Text style={styles.clinicName}>Rubio García Dental</Text>
              <Text style={styles.clinicSubtitle}>Implantología y estética de vanguardia</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={handleVerifySync}
                disabled={isVerifying}
              >
                <Activity 
                  color={Colors.light.primary} 
                  size={18} 
                  style={isVerifying ? styles.spinning : undefined}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.syncButton} 
                onPress={() => syncNow()}
                disabled={isSyncing}
              >
                <RefreshCw 
                  color={isConnected ? Colors.light.success : Colors.light.error} 
                  size={20} 
                  style={isSyncing ? styles.spinning : undefined}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Sync Status */}
          <View style={styles.syncStatus}>
            <View style={styles.connectionStatus}>
              <Database color={Colors.light.primary} size={16} />
              <Text style={styles.connectionText}>
                SQL Server - {syncStatsData.totalAppointments} registros
              </Text>
              {isConnected ? (
                <CheckCircle color={Colors.light.success} size={14} style={styles.connectionIcon} />
              ) : (
                <AlertCircle color={Colors.light.error} size={14} style={styles.connectionIcon} />
              )}
            </View>
            
            {lastSyncTime && (
              <Text style={styles.lastSyncText}>
                Última sincronización: {lastSyncTime.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
            
            {/* New and Updated Appointments Info */}
            {(newAppointments.length > 0 || updatedAppointments.length > 0) && (
              <View style={styles.changesContainer}>
                {newAppointments.length > 0 && (
                  <View style={styles.changeItem}>
                    <Plus color={Colors.light.success} size={12} />
                    <Text style={styles.changeText}>
                      {newAppointments.length} nuevas
                    </Text>
                  </View>
                )}
                {updatedAppointments.length > 0 && (
                  <View style={styles.changeItem}>
                    <Edit3 color={Colors.light.warning} size={12} />
                    <Text style={styles.changeText}>
                      {updatedAppointments.length} actualizadas
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {syncError && (
              <View style={styles.errorContainer}>
                <AlertCircle color={Colors.light.error} size={14} />
                <Text style={styles.errorText}>{syncError}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <TouchableOpacity key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <stat.icon color={stat.color} size={24} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SQL Server Sync Info */}
        {(newAppointments.length > 0 || updatedAppointments.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambios Recientes</Text>
            <View style={styles.changesGrid}>
              {newAppointments.length > 0 && (
                <View style={styles.changeCard}>
                  <View style={styles.changeCardHeader}>
                    <Plus color={Colors.light.success} size={20} />
                    <Text style={styles.changeCardTitle}>Citas Nuevas</Text>
                  </View>
                  <Text style={styles.changeCardValue}>{newAppointments.length}</Text>
                  <Text style={styles.changeCardSubtitle}>Desde última sincronización</Text>
                </View>
              )}
              {updatedAppointments.length > 0 && (
                <View style={styles.changeCard}>
                  <View style={styles.changeCardHeader}>
                    <Edit3 color={Colors.light.warning} size={20} />
                    <Text style={styles.changeCardTitle}>Actualizadas</Text>
                  </View>
                  <Text style={styles.changeCardValue}>{updatedAppointments.length}</Text>
                  <Text style={styles.changeCardSubtitle}>Modificaciones detectadas</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Citas de Hoy</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color={Colors.light.textSecondary} size={48} />
              <Text style={styles.emptyStateText}>No hay citas programadas para hoy</Text>
              <Text style={styles.emptyStateSubtext}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              {todayAppointments.slice(0, 3).map((appointment) => (
                <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentTime}>
                    <Clock color={Colors.light.primary} size={16} />
                    <Text style={styles.appointmentTimeText}>{appointment.time || 'Sin hora'}</Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentPatient}>{appointment.patientName}</Text>
                    <Text style={styles.appointmentTreatment}>{appointment.treatment}</Text>
                    {appointment.dentist && (
                      <Text style={styles.appointmentDentist}>Dr. {appointment.dentist}</Text>
                    )}
                  </View>
                  <View style={[styles.appointmentStatus, 
                    { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                    <Text style={[styles.appointmentStatusText, 
                      { color: getStatusColor(appointment.status) }]}>
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Messages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mensajes Recientes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {conversations.filter(c => c.unreadCount > 0).length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare color={Colors.light.textSecondary} size={48} />
              <Text style={styles.emptyStateText}>No hay mensajes pendientes</Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {conversations.filter(c => c.unreadCount > 0).slice(0, 3).map((conversation) => (
                <TouchableOpacity key={conversation.id} style={styles.messageCard}>
                  <View style={styles.messageAvatar}>
                    <Text style={styles.messageAvatarText}>
                      {conversation.patient.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={styles.messagePatient}>{conversation.patient.name}</Text>
                    <Text style={styles.messageText} numberOfLines={2}>
                      {conversation.lastMessage.content}
                    </Text>
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={styles.messageTime}>
                      {new Date(conversation.lastMessage.timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Users color={Colors.light.primary} size={24} />
              <Text style={styles.quickActionText}>Nuevo Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Calendar color={Colors.light.primary} size={24} />
              <Text style={styles.quickActionText}>Nueva Cita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <MessageSquare color={Colors.light.primary} size={24} />
              <Text style={styles.quickActionText}>Mensaje Masivo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled': return Colors.light.primary;
    case 'completed': return Colors.light.success;
    case 'cancelled': return Colors.light.error;
    case 'no-show': return Colors.light.warning;
    default: return Colors.light.textSecondary;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'scheduled': return 'Programada';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    case 'no-show': return 'No asistió';
    default: return 'Desconocido';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '15',
  },
  syncButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  syncStatus: {
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    color: Colors.light.text,
  },
  lastSyncText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    color: Colors.light.error,
    marginLeft: 4,
    flex: 1,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoImage: {
    width: 30,
    height: 30,
    tintColor: Colors.light.surface,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  clinicSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  dateContainer: {
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: 'center',
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 4,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  appointmentTreatment: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appointmentDentist: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageAvatarText: {
    color: Colors.light.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
  },
  messagePatient: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  messageInfo: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: Colors.light.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: Colors.light.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  changesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  changesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  changeCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  changeCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  changeCardSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  connectionIcon: {
    marginLeft: 8,
  },
});