import React from 'react';
import { Stack } from 'expo-router';
import { AppHeader } from '@/components';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <AppHeader title="Dashboard" />,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}