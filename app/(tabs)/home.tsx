import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dashboard from '@/components/Dashboard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Dashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});