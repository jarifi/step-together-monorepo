import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { changePassword } from '../../services/userService';

const PasswordScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser(); 

  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handlePasswordUpdate = async () => {
    if (!user) {
      Alert.alert('Fehler', 'Du bist nicht eingeloggt.');
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Fehler', 'Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen haben.');
      return;
    }

    try {
      setLoading(true);

      await changePassword(oldPassword, newPassword);

      Alert.alert('Erfolg', 'Passwort wurde erfolgreich geändert.');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Fehler',
        err?.response?.data?.detail ??
          'Das Passwort konnte nicht geändert werden.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Passwort ändern</Text>

        {/* Altes Passwort */}
        <Text style={styles.label}>Altes Passwort</Text>
        <TextInput
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#9CA3AF"
        />

        {/* Neues Passwort */}
        <Text style={styles.label}>Neues Passwort</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#9CA3AF"
        />

        {/* Bestätigung */}
        <Text style={styles.label}>Neues Passwort bestätigen</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#9CA3AF"
        />

        {/* Button */}
        <Pressable
          style={[styles.button, loading && styles.disabled]}
          disabled={loading}
          onPress={handlePasswordUpdate}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Wird aktualisiert...' : 'Passwort ändern'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5efff',
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },

  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
    marginLeft: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },

  button: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#658869ff',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  disabled: {
    opacity: 0.6,
  },
});
