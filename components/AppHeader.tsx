import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DentalIcon } from './DentalIcon';
import Colors from '@/constants/colors';

type AppHeaderProps = {
  title?: string;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'Dental Clinic' }) => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <DentalIcon variant="blue" size={32} />
        <Text style={styles.title}>{title}</Text>
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
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
});

export default AppHeader;