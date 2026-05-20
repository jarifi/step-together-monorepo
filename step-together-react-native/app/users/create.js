import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import Toast from 'react-native-toast-message';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateStepLength,
} from '../../lib/userValidation';
import { createUser } from '../../services/userService';

// -----------------------------
// helpers (comma/dot safe)
// -----------------------------
const sanitizeStepLengthInput = (raw) => {
  let v = String(raw ?? '').replace(/[^\d.,]/g, '');
  const firstSepIndex = v.search(/[.,]/);
  if (firstSepIndex !== -1) {
    const before = v.slice(0, firstSepIndex + 1);
    const after = v.slice(firstSepIndex + 1).replace(/[.,]/g, '');
    v = before + after;
  }
  return v;
};

const normalizeStepLength = (v) =>
  String(v ?? '').trim().replace(',', '.');

// ====== UI tokens ======
const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  inputBg: '#FBFCFB',
  ok: '#027A48',
};

const FieldLabel = ({ children }) => (
  <Text style={styles.label}>{children}</Text>
);

const PasswordField = ({
  label,
  value,
  onChangeText,
  show,
  onToggle,
  disabled,
}) => {
  const hasValue = value.length > 0;

  return (
    <View style={{ marginBottom: 10 }}>
      <FieldLabel>{label}</FieldLabel>

      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.sub} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.rowInput}
          placeholderTextColor="#8A9590"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />

        {hasValue && (
          <Pressable
            onPress={onToggle}
            disabled={disabled}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed && styles.pressed,
            ]}
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

// password requirements
const getPwReqState = (pw) => ({
  minLen: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  digit: /\d/.test(pw),
});

const allOk = (s) =>
  s.minLen && s.upper && s.lower && s.digit;

const RequirementLine = ({ ok, text }) => (
  <View style={styles.reqLine}>
    <Ionicons
      name={ok ? 'checkmark-circle' : 'ellipse-outline'}
      size={16}
      color={ok ? COLORS.ok : '#9AA4A0'}
    />
    <Text style={[styles.reqText, ok && styles.reqTextOk]}>
      {text}
    </Text>
  </View>
);

export default function CreateUserScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stepLength, setStepLength] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const showError = (msg) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: String(msg),
      position: 'top',
      topOffset: 100,
    });
  };

  const stepLengthNormalized = useMemo(
    () => normalizeStepLength(stepLength),
    [stepLength]
  );

  const stepLengthNumber = useMemo(() => {
    const n = Number(stepLengthNormalized);
    return Number.isFinite(n) ? n : NaN;
  }, [stepLengthNormalized]);

  const req = useMemo(() => getPwReqState(password), [password]);
  const pwValid = useMemo(() => allOk(req), [req]);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !password ||
      !passwordConfirm ||
      !Number.isFinite(stepLengthNumber)
    ) {
      showError('Alle Felder sind Pflichtfelder!');
      setPwTouched(true);
      return;
    }

    const emailErrors = validateEmail(trimmedEmail);
    const nameErrors = validateName(trimmedName);
    const stepLengthErrors = validateStepLength(stepLengthNormalized);
    const passwordErrors = validatePassword(password);

    const allErrors = [
      ...emailErrors,
      ...nameErrors,
      ...stepLengthErrors,
      ...(password !== passwordConfirm
        ? ['Passwörter stimmen nicht überein!']
        : []),
      ...passwordErrors,
      ...(pwTouched && !pwValid
        ? ['Das Passwort erfüllt die Anforderungen noch nicht.']
        : []),
    ].filter(Boolean);

    if (allErrors.length > 0) {
      allErrors.forEach((err, i) =>
        setTimeout(() => showError(err), i * 900)
      );
      return;
    }

    setLoading(true);
    try {
      await createUser({
        email: trimmedEmail,
        password,
        passwordConfirm,
        name: trimmedName,
        stepLength: stepLengthNumber,
      });

      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Benutzer erfolgreich erstellt!',
        position: 'top',
        topOffset: 100,
      });

      router.replace('/users');
    } catch (error) {
      const apiMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Benutzer konnte nicht erstellt werden!';

      showError(apiMsg);
      console.error('Create user failed:', error?.response?.data ?? error);
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
          <View style={styles.headerCard}>
            <Text style={styles.title}>Benutzer erstellen</Text>
          </View>

          <View style={styles.formCard}>
            <FieldLabel>NAME</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Vor- und Nachname"
              placeholderTextColor="#8A9590"
              style={styles.input}
              editable={!loading}
            />

            <FieldLabel>E-MAIL</FieldLabel>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-Mail"
              placeholderTextColor="#8A9590"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <FieldLabel>SCHRITTLÄNGE</FieldLabel>
            <TextInput
              value={stepLength}
              onChangeText={(t) =>
                setStepLength(sanitizeStepLengthInput(t))
              }
              placeholder="Schrittlänge (in cm)"
              placeholderTextColor="#8A9590"
              style={styles.input}
              keyboardType="decimal-pad"
              inputMode="decimal"
              editable={!loading}
            />

            <PasswordField
              label="PASSWORT"
              value={password}
              onChangeText={(t) => {
                if (!pwTouched) setPwTouched(true);
                setPassword(t);
              }}
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              disabled={loading}
            />

            <PasswordField
              label="PASSWORT BESTÄTIGEN"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              show={showPw2}
              onToggle={() => setShowPw2((v) => !v)}
              disabled={loading}
            />

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => router.back()}
                disabled={loading}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>
                  Abbrechen
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCreate}
                disabled={loading}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Erstelle…' : 'Erstellen'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 26 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 120,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.sub,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reqText: {
    marginLeft: 8,
    fontSize: 12,
  },
  reqTextOk: {
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  primaryBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
