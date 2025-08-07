import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ImageBackground,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { router } from 'expo-router';



import { saveToken, saveUserId } from '../lib/auth';
import { useUser } from '../context/UserContext';

import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

console.log("ARIFI" + API_BASE_URL);


export default function LoginScreen() {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('StrongPassword123');
  const { setUser, setToken, setUserId } = useUser();

  const handleLogin = async () => {
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Requesting:', `${API_BASE_URL}/auth/login`)
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

      if (!response.ok || !data.access_token || !data.user_id) {
        throw new Error(data.message || 'Login fehlgeschlagen');
      }

      await saveToken(data.access_token);
      await saveUserId(String(data.user_id));

      setToken(data.access_token);
      setUserId(String(data.user_id));
      setUser(data.user); // falls Backend auch User-Daten zurückgibt

      router.replace('/home');
    } catch (err: any) {
      console.error('Login-Fehler:', err.message ?? err);
      Alert.alert('Fehler', err.message ?? 'Unbekannter Fehler');
    }
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
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Einloggen</Text>
          </Pressable >
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
