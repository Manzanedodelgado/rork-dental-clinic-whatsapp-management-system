import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StorageProvider } from "@/hooks/useStorage";
import { ClinicProvider } from "@/hooks/useClinicStore";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/app/login";
import Colors from "@/constants/colors";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch((e) => console.log('Splash prevent error', e));
}

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
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppReady(true);
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
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

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, message: msg };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.log('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.loadingContainer} testID="app-error-boundary">
          <Text style={styles.loadingText}>Error cargando la vista previa</Text>
          <Text style={styles.loadingText}>Detalle: {this.state.message}</Text>
          <Text style={styles.loadingText}>Refresca la página o abre con el QR en Expo Go.</Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
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
              <AppErrorBoundary>
                <AuthenticatedApp />
              </AppErrorBoundary>
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