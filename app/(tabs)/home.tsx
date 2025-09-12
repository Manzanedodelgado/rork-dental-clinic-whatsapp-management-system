import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/hooks/useClinicStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import RubioGarciaLogo from '@/components/RubioGarciaLogo';
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { patients, appointments, lastSyncTime } = useClinic();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
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

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.date).toDateString() === today;
  });

  const quickActions = [
    {
      title: 'Agenda',
      subtitle: `${todayAppointments.length} citas hoy`,
      icon: Calendar,
      color: Colors.light.primary,
      route: '/agenda',
      permission: 'agenda'
    },
    {
      title: 'Pacientes',
      subtitle: `${patients.length} registrados`,
      icon: Users,
      color: '#10B981',
      route: '/patients',
      permission: 'patients'
    },
    {
      title: 'WhatsApp',
      subtitle: 'Mensajes',
      icon: MessageCircle,
      color: '#25D366',
      route: '/chat',
      permission: 'whatsapp'
    },
    {
      title: 'Dashboard',
      subtitle: 'Análisis completo',
      icon: BarChart3,
      color: '#8B5CF6',
      route: '/(home)/home',
      permission: 'dashboard'
    }
  ];

  const stats = [
    {
      title: 'Citas Hoy',
      value: todayAppointments.length.toString(),
      icon: Clock,
      color: Colors.light.primary
    },
    {
      title: 'Total Pacientes',
      value: patients.length.toString(),
      icon: Users,
      color: '#10B981'
    },
    {
      title: 'Este Mes',
      value: appointments.filter(apt => {
        const thisMonth = new Date().getMonth();
        return new Date(apt.date).getMonth() === thisMonth;
      }).length.toString(),
      icon: TrendingUp,
      color: '#F59E0B'
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <RubioGarciaLogo width={60} height={60} />
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.username}</Text>
            <Text style={styles.lastSync}>Última sync: {formatLastSync()}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Resumen Rápido</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={`stat-${stat.title}-${index}`} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                    <IconComponent size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={`action-${action.title}-${index}`}
                  style={styles.actionCard}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                    <IconComponent size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Appointments Preview */}
        {todayAppointments.length > 0 && (
          <View style={styles.appointmentsContainer}>
            <Text style={styles.sectionTitle}>Citas de Hoy</Text>
            <View style={styles.appointmentsList}>
              {todayAppointments.slice(0, 3).map((apt, index) => (
                <View key={`apt-${apt.id}-${index}`} style={styles.appointmentCard}>
                  <View style={styles.appointmentTime}>
                    <Clock size={16} color={Colors.light.primary} />
                    <Text style={styles.appointmentTimeText}>
                      {apt.time}
                    </Text>
                  </View>
                  <Text style={styles.appointmentPatient}>{apt.patientName}</Text>
                  <Text style={styles.appointmentTreatment}>{apt.treatment}</Text>
                </View>
              ))}
              {todayAppointments.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => router.push('/agenda')}
                >
                  <Text style={styles.viewMoreText}>
                    Ver {todayAppointments.length - 3} citas más
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.surface,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoContainer: {
    marginRight: 16,
  },
  welcomeContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  lastSync: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsContainer: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    margin: 4,
    elevation: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  appointmentsContainer: {
    marginBottom: 24,
  },
  appointmentsList: {
    paddingHorizontal: 20,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    elevation: 1,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 6,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  appointmentTreatment: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  viewMoreButton: {
    backgroundColor: `${Colors.light.primary}15`,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});