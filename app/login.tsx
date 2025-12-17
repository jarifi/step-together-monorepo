// file: app/login.tsx

import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Constants from 'expo-constants';
import { router } from 'expo-router';

import { useUser } from '../context/UserContext';
import { saveTokens, saveUserId } from '../lib/auth';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export default function LoginScreen() {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('StrongPassword123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { setUser, setToken, setUserId } = useUser();

  const handleLogin = async () => {
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let message = 'Login fehlgeschlagen';

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((d: any) => {
              const field = d.loc?.[1];
              if (field === 'email') return 'Bitte gültige E-Mail eingeben';
              if (field === 'password') return 'Bitte gültiges Passwort eingeben';
              return d.msg;
            })
            .join('\n');
        } else if (data.detail) {
          message = data.detail;
        }

        showError(message);
        return;
      }

      if (!data.accessToken || !data.refreshToken || !data.userId) {
        showError('Login fehlgeschlagen');
        return;
      }

      await saveTokens(data.accessToken, data.refreshToken);
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      if (data.user) {
        setUser(data.user);
      }

      router.replace('/dashboard');
    } catch (err: any) {
      showError(err.message ?? 'Unbekannter Fehler');
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* LOGO */}
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* LOGIN CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>Willkommen</Text>

          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMessage && (
            <Text style={styles.error}>{errorMessage}</Text>
          )}

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Einloggen</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#313633c7',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 110,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  logo: {
    width: 250,
    height: 150,
    marginBottom: 52,
  },

  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(80, 92, 73, 0.83)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  title: {
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },

  input: {
    backgroundColor: 'rgba(108, 118, 96, 0.65)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(108, 118, 96, 0.65)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 16,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#698059ff',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  error: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
});
