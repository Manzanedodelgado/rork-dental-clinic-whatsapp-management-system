import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { RubioGarciaLogo } from './RubioGarciaLogo';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/colors';
import { LogOut, User } from 'lucide-react-native';

type AppHeaderProps = {
  title?: string;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'Rubio García Dental' }) => {
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Debug: Log permissions in header
  React.useEffect(() => {
    if (user) {
      console.log('📱 AppHeader - User permissions check:');
      console.log('- User:', user.username, '| Role:', user.role);
      console.log('- Permissions array:', user.permissions);
      console.log('- Has dashboard:', hasPermission('dashboard'));
      console.log('- Has patients:', hasPermission('patients'));
      console.log('- Has appointments:', hasPermission('appointments'));
      console.log('- Has whatsapp:', hasPermission('whatsapp'));
      console.log('- Has users:', hasPermission('users'));
    }
  }, [user, hasPermission]);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <RubioGarciaLogo variant="full" width={180} />
      </View>
      
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <User size={16} color={Colors.light.textSecondary} />
          <Text style={styles.username}>{user?.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <LogOut size={18} color={Colors.light.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    elevation: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  username: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
});

export default AppHeader;