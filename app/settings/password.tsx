import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { changePassword } from '../../services/userService';

const COLORS = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#2F6B45',
  inputBg: '#FAFBFA',
  tint: '#CFE0D3',
};

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
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.sub} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.input}
          placeholderTextColor="#9AA4A0"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          onPress={onToggle}
          disabled={disabled}
          style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#6B7280"
          />
        </Pressable>
      </View>
    </View>
  );
};

const PasswordScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const canSubmit =
    !loading &&
    oldPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={() => router.back()}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </Pressable>

            <View style={{ width: 44, height: 44 }} />
          </View>

          {/* CARD */}
          <View style={styles.card}>
            <View style={styles.headerBlock}>
              <View style={styles.headerIcon}>
                <Ionicons name="key-outline" size={22} color={COLORS.text} />
              </View>

              <Text style={styles.header}>Passwort ändern</Text>
            </View>

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
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                !canSubmit && styles.disabled,
              ]}
              disabled={!canSubmit}
              onPress={handlePasswordUpdate}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Wird aktualisiert…' : 'Passwort ändern'}
              </Text>
            </Pressable>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#111" />
              <Text style={styles.infoText}>
                Wenn du dein Passwort vergessen hast, melde dich beim Support.
              </Text>
            </View>
          </View>

          <View style={{ height: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
   scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 120, 
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  pressed: { opacity: 0.85 },

  // Card
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },

  headerBlock: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.tint,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 18,
  },

  // Fields
  field: { width: '100%', marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.sub,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#101828',
    paddingVertical: 0,
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Button
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  disabled: { opacity: 0.55 },

  // Info
  infoBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.tint,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#111',
    lineHeight: 16,
    fontWeight: '600',
  },

});
