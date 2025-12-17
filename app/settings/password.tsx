import { Ionicons } from '@expo/vector-icons';
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

/* ======================================================
   Reusable Password Field (OUTSIDE the screen!)
====================================================== */

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  show,
  onToggle,
  disabled,
}) => {
  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.inputWithIcon}
          placeholderTextColor="#9CA3AF"
        />

        <Pressable
          onPress={onToggle}
          disabled={disabled}
          style={styles.eyeButton}
          hitSlop={10}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#6B7280"
          />
        </Pressable>
      </View>
    </>
  );
};

/* ======================================================
   Screen
====================================================== */

const PasswordScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 👁 visibility states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

        <PasswordField
          label="Altes Passwort"
          value={oldPassword}
          onChangeText={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld((v) => !v)}
          disabled={loading}
        />

        <PasswordField
          label="Neues Passwort"
          value={newPassword}
          onChangeText={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          disabled={loading}
        />

        <PasswordField
          label="Neues Passwort bestätigen"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          disabled={loading}
        />

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

/* ======================================================
   Styles
====================================================== */

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

  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },

  inputWithIcon: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 46,
    borderRadius: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },

  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
