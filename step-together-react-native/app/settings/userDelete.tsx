import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { deleteOwnAccount } from '../../services/userService';

const COLORS = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#2F6B45',
  inputBg: '#FAFBFA',
  tint: '#CFE0D3',
  danger: '#B42318',
  dangerSoft: 'rgba(180,35,24,0.08)',
  dangerBorder: 'rgba(180,35,24,0.16)',
  overlay: 'rgba(15,20,17,0.35)',
};

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  placeholder?: string;
};

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  show,
  onToggle,
  disabled,
  placeholder = 'Passwort eingeben',
}) => {
  const hasValue = value.length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.sub} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9AA4A0"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />

        {hasValue && (
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
        )}
      </View>
    </View>
  );
};

const UserDeleteScreen: React.FC = () => {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canOpenConfirm = !loading && password.trim().length > 0;

  const blurActiveElement = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
  };

  const clearLocalAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_id',
        'user_role',
        'force_pw_change',
      ]);
    } catch (error) {
      console.error('Failed to clear local auth data:', error);
    }
  };

  const goBackSafe = () => {
    blurActiveElement();
    router.back();
  };

  const goLoginSafe = () => {
    blurActiveElement();
    router.replace('/login');
  };

  const handleOpenConfirm = () => {
    blurActiveElement();
    if (!canOpenConfirm) return;

    setErrorMessage('');
    setShowConfirmModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!password.trim() || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');
      blurActiveElement();

      await deleteOwnAccount(password);
      await clearLocalAuthData();

      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Account deletion failed:', error);
      setShowConfirmModal(false);
      setErrorMessage(
        'Der Account konnte nicht gelöscht werden. Bitte prüfe dein Passwort.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={{ width: 44, height: 44 }} />
          </View>

          <View style={styles.card}>
            <View style={styles.headerBlock}>
              <View style={[styles.headerIcon, styles.headerIconDanger]}>
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              </View>

              <Text style={styles.header}>Account löschen</Text>

            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
              <Text style={styles.warningText}>
                Gib dein aktuelles Passwort ein, um die Löschung deines Accounts zu
                bestätigen.
              </Text>
            </View>

            <PasswordField
              label="Aktuelles Passwort"
              value={password}
              onChangeText={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              disabled={loading}
            />

            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
                !canOpenConfirm && styles.disabled,
              ]}
              disabled={!canOpenConfirm}
              onPress={handleOpenConfirm}
            >
              <Text style={styles.deleteButtonText}>
                {loading ? 'Wird gelöscht…' : 'Account dauerhaft löschen'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
                loading && styles.disabled,
              ]}
              disabled={loading}
              onPress={goBackSafe}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </Pressable>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, styles.headerIconDanger]}>
              <Ionicons name="warning-outline" size={24} color={COLORS.danger} />
            </View>

            <Text style={styles.modalTitle}>Wirklich löschen?</Text>
            <Text style={styles.modalText}>
              Möchtest du deinen Account wirklich dauerhaft löschen? Diese Aktion
              kann nicht rückgängig gemacht werden.
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  pressed && styles.pressed,
                ]}
                disabled={loading}
              >
                <Text style={styles.modalCancelText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteConfirmed}
                style={({ pressed }) => [
                  styles.modalDeleteBtn,
                  pressed && styles.pressed,
                  loading && styles.disabled,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Endgültig löschen</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={goLoginSafe}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.accent} />
            </View>

            <Text style={styles.modalTitle}>Account gelöscht</Text>
            <Text style={styles.modalText}>
              Dein Account wurde erfolgreich gelöscht.
            </Text>

            <Pressable
              onPress={goLoginSafe}
              style={({ pressed }) => [
                styles.successBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.successBtnText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UserDeleteScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 120,
  },

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
  pressed: { opacity: 0.85 },

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
  headerIconDanger: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerBorder,
  },
  header: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtext: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.sub,
    textAlign: 'center',
    maxWidth: 280,
  },

  warningBox: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
    fontWeight: '600',
  },

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

  helperText: {
    marginTop: -2,
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '700',
  },

  deleteButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.sub,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 48,
    marginRight: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalDeleteBtn: {
    flex: 1,
    minHeight: 48,
    marginLeft: 5,
    borderRadius: 16,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.tint,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  successBtn: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});