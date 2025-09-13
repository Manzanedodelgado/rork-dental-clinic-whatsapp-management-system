import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StorageProvider } from "@/hooks/useStorage";
import { ClinicProvider } from "@/hooks/useClinicStore";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/app/login";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: "modal",
          title: "Modal"
        }} 
      />
    </Stack>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.loadingText}>Cargando aplicación...</Text>
    </View>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAppReady(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    if (!isLoading) {
      initializeApp();
    }
  }, [isLoading]);

  if (isLoading || !appReady) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [providersReady, setProvidersReady] = useState(false);

  useEffect(() => {
    // Initialize providers
    const timer = setTimeout(() => {
      setProvidersReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!providersReady) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <AuthProvider>
          <ClinicProvider>
            <GestureHandlerRootView style={styles.container}>
              <AuthenticatedApp />
            </GestureHandlerRootView>
          </ClinicProvider>
        </AuthProvider>
      </StorageProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
});