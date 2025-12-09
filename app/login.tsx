//file: app/login.tsx

import { useState } from 'react';

import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { router } from 'expo-router';



import { useUser } from '../context/UserContext';
import { saveTokens, saveUserId } from '../lib/auth';

import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

console.log("ARIFI" + API_BASE_URL);


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
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let message = 'Login fehlgeschlagen';
        if (Array.isArray(data.detail)) {
          message = data.detail.map((d: any) => {
            if (typeof d.msg === 'string') {
              const field = d.loc?.[1];
              if (field === 'email') return 'Bitte geben Sie eine gültige E-Mail-Adresse ein!';
              if (field === 'password') return 'Bitte geben Sie ein gültige Passwort ein!';
              return d.msg;
            }
            return JSON.stringify(d);
          }).join('\n');
        } else if (data.detail) {
          message = data.detail;
        }
        showError(message);
        return;
      }

      if (!data.accessToken || !data.userId || !data.refreshToken) {
        showError('Login fehlgeschlagen');
        return;
      }

      await saveTokens(data.accessToken, data.refreshToken);

      // FIX: backend returns userId, not user_id
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      // Optional, only if your backend returns user object
      if (data.user) {
        setUser(data.user);
      }

      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Login-Fehler:', err.message ?? err);
      showError(err.message ?? "Unbekannter Fehler");
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  return (
    <ImageBackground
      source={require('../assets/images/background1.jpg')}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
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
            <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
              {errorMessage}
            </Text>
          )}
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Einloggen</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 24,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  title: { fontSize: 26, color: '#fff', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: { backgroundColor: '#1e604c', paddingVertical: 14, borderRadius: 8, marginTop: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
