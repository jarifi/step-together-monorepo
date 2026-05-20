import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
  View,
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
  danger: '#B42318',
  ok: '#027A48',
};

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  error?: boolean;
  childrenBelow?: React.ReactNode;
};

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  show,
  onToggle,
  disabled,
  error,
  childrenBelow,
}) => {
  const hasValue = value.length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.sub} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.input}
          placeholderTextColor="#9AA4A0"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />

        {/* Eye icon only once something is typed */}
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

      {childrenBelow}
    </View>
  );
};

type PwReqState = {
  minLen: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
};

const getPwReqState = (pw: string): PwReqState => ({
  minLen: pw.length >= 12,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  digit: /\d/.test(pw),
});

const allOk = (s: PwReqState) => s.minLen && s.upper && s.lower && s.digit;

const RequirementLine = ({
  ok,
  text,
}: {
  ok: boolean;
  text: string;
}) => {
  return (
    <View style={styles.reqLine}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? COLORS.ok : '#9AA4A0'}
      />
      <Text style={[styles.reqText, ok && styles.reqTextOk]}>{text}</Text>
    </View>
  );
};

const levenshtein = (a: string, b: string): number => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          1 +
          Math.min(
            matrix[i - 1][j],
            matrix[i][j - 1],
            matrix[i - 1][j - 1]
          );
      }
    }
  }

  return matrix[b.length][a.length];
};

const similarityPercentage = (a: string, b: string): number => {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return ((maxLen - distance) / maxLen) * 100;
};

// ---- stronger similarity rules (keeps your UI/code structure the same) ----
const commonPrefixLength = (a: string, b: string): number => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

const commonSuffixLength = (a: string, b: string): number => {
  let i = 0;
  while (
    i < a.length &&
    i < b.length &&
    a[a.length - 1 - i] === b[b.length - 1 - i]
  ) {
    i++;
  }
  return i;
};

const isTooSimilar = (oldPw: string, newPw: string): boolean => {
  const oldS = oldPw.trim();
  const newS = newPw.trim();
  if (!oldS || !newS) return false;

  const minLen = Math.min(oldS.length, newS.length);
  if (minLen === 0) return true;

  // Rule A: Levenshtein similarity
  const sim = similarityPercentage(oldS, newS);
  if (sim >= 85) return true;

  // Rule B: very long common prefix/suffix
  const prefix = commonPrefixLength(oldS, newS);
  const suffix = commonSuffixLength(oldS, newS);

  if (prefix / minLen >= 0.7) return true;
  if (suffix / minLen >= 0.7) return true;

  // Rule C: only a tiny middle part changed
  if ((prefix + suffix) / minLen >= 0.85) return true;

  return false;
};

const PasswordScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [newTouched, setNewTouched] = useState(false);

  const req = useMemo(() => getPwReqState(newPassword), [newPassword]);
  const newValid = useMemo(() => allOk(req), [req]);

  const showReqBox = newTouched;

  const handlePasswordUpdate = async () => {
    if (!user) {
      Alert.alert('Fehler', 'Du bist nicht eingeloggt.');
      return;
    }

    if (!oldPassword || !newPassword) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
      setNewTouched(true);
      return;
    }

    if (isTooSimilar(oldPassword, newPassword)) {
      Alert.alert(
        'Fehler',
        'Das neue Passwort ist dem alten zu ähnlich. Bitte wähle ein deutlich anderes Passwort.'
      );
      setNewTouched(true);
      return;
    }

    if (!newValid) {
      Alert.alert('Fehler', 'Das neue Passwort erfüllt die Anforderungen noch nicht.');
      setNewTouched(true);
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
        err?.response?.data?.detail ?? 'Das Passwort konnte nicht geändert werden.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && oldPassword.length > 0 && newPassword.length > 0 && newValid;

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
              onChangeText={(t) => {
                if (!newTouched) setNewTouched(true);
                setNewPassword(t);
              }}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              disabled={loading}
              error={showReqBox && !newValid && newPassword.length > 0}
              childrenBelow={
                showReqBox ? (
                  <View style={[styles.reqBox, newValid && styles.reqBoxOk]}>
                    <View style={styles.reqHeaderRow}>
                      <Ionicons
                        name={newValid ? 'checkmark-circle' : 'information-circle-outline'}
                        size={18}
                        color={newValid ? COLORS.ok : COLORS.sub}
                      />
                      <Text style={styles.reqHeaderText}>
                        {newValid ? 'Passwort ist stark genug.' : 'Passwort-Anforderungen'}
                      </Text>
                    </View>

                    <RequirementLine ok={req.minLen} text="Mindestens 12 Zeichen" />
                    <RequirementLine ok={req.upper} text="Mindestens 1 Großbuchstabe (A–Z)" />
                    <RequirementLine ok={req.lower} text="Mindestens 1 Kleinbuchstabe (a–z)" />
                    <RequirementLine ok={req.digit} text="Mindestens 1 Zahl (0–9)" />
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    Mindestens 12 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl.
                  </Text>
                )
              }
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
  header: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
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
  inputRowError: {
    borderColor: 'rgba(180,35,24,0.35)',
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
    marginTop: 8,
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  reqBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    padding: 12,
  },
  reqBoxOk: {
    borderColor: 'rgba(2,122,72,0.25)',
    backgroundColor: 'rgba(2,122,72,0.06)',
  },
  reqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  reqHeaderText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  reqLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  reqText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  reqTextOk: {
    color: '#1F2937',
  },

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
