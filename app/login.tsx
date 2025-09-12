import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,

  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { RubioGarciaLogo } from '@/components/RubioGarciaLogo';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      console.log('Error: Por favor, ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username.trim(), password);
      if (!success) {
        console.log('Error: Usuario o contraseña incorrectos');
      }
    } catch (error: any) {
      console.log('Error al iniciar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <RubioGarciaLogo width={120} variant="icon" />
            <Text style={styles.title}>Rubio García Dental</Text>
            <Text style={styles.subtitle}>Sistema de Gestión</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu usuario"
                placeholderTextColor={Colors.light.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                testID="username-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={Colors.light.textSecondary}
                secureTextEntry
                testID="password-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Usuario administrador: JMD
            </Text>
            <Text style={styles.footerText}>
              Contraseña: 190582
            </Text>
            <Text style={styles.footerText}>
              Usuario de prueba: usuario_test
            </Text>
            <Text style={styles.footerText}>
              Contraseña: 123456
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
});