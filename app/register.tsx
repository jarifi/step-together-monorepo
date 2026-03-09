import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useMemo, useState } from 'react';
import {
    Image,
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
import Toast from 'react-native-toast-message';
import {
    validateEmail,
    validateName,
    validatePassword,
} from '../lib/userValidation';
import { createUser } from '../services/userService';

type FieldLabelProps = {
  children: ReactNode;
};

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
};

type PasswordRequirementState = {
  minLen: boolean;
  upper: boolean;
  digit: boolean;
};

type RequirementLineProps = {
  ok: boolean;
  text: string;
};

const PRIVACY_POLICY_TEXT = `
1. Verarbeitete Daten
Wir verarbeiten im Rahmen der App-Nutzung:
- E-Mail-Adresse
- Benutzer-ID
- Team- und Challenge-Daten
- ggf. Schritt-/Aktivitätsdaten
- technische Log-Daten

2. Zweck
Die Verarbeitung dient der Bereitstellung der App, der Durchführung von Challenges, der Benutzerverwaltung sowie der technischen Sicherheit.

3. Speicherung
Die Speicherung und Verarbeitung der Daten erfolgt auf Servern innerhalb der Europäischen Union (EU). Eine Übermittlung in Drittstaaten erfolgt nicht, sofern dies nicht gesetzlich erforderlich ist.

4. Speicherdauer
Daten werden nur so lange gespeichert, wie das Benutzerkonto besteht oder gesetzliche Pflichten dies erfordern.

5. Rechte
Nutzer haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch gemäß DSGVO.
`;

const COLORS = {
  bg: '#313633c7',
  card: 'rgba(94, 103, 81, 0.83)',
  cardBorder: 'rgba(255,255,255,0.12)',
  inputBg: 'rgba(108, 118, 96, 0.65)',
  inputBorder: 'rgba(108, 118, 96, 0.65)',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.78)',
  accent: '#698059ff',
  ok: '#9EE6B0',
};

const FieldLabel = ({ children }: FieldLabelProps) => (
  <Text style={styles.label}>{children}</Text>
);

const PasswordField = ({
  label,
  value,
  onChangeText,
  show,
  onToggle,
  disabled,
}: PasswordFieldProps) => {
  const hasValue = value.length > 0;

  return (
    <View style={styles.fieldBlock}>
      <FieldLabel>{label}</FieldLabel>

      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color="#fff" />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.rowInput}
          placeholderTextColor="rgba(255,255,255,0.55)"
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
              color="#fff"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const getPwReqState = (pw: string): PasswordRequirementState => ({
  minLen: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  digit: /\d/.test(pw),
});

const allOk = (s: PasswordRequirementState): boolean =>
  s.minLen && s.upper && s.digit;

const RequirementLine = ({ ok, text }: RequirementLineProps) => (
  <View style={styles.reqLine}>
    <Ionicons
      name={ok ? 'checkmark-circle' : 'ellipse-outline'}
      size={16}
      color={ok ? COLORS.ok : 'rgba(255,255,255,0.45)'}
    />
    <Text style={[styles.reqText, ok && styles.reqTextOk]}>{text}</Text>
  </View>
);

const sanitizeStepLengthInput = (raw: string): string => {
  let value = String(raw ?? '').replace(/[^\d.,]/g, '');

  const firstSeparatorIndex = value.search(/[.,]/);
  if (firstSeparatorIndex !== -1) {
    const before = value.slice(0, firstSeparatorIndex + 1);
    const after = value.slice(firstSeparatorIndex + 1).replace(/[.,]/g, '');
    value = before + after;
  }

  value = value.replace(',', '.');

  // practical limit:
  // examples allowed: 0.7 / 0.75 / 1 / 1.2
  // not 3 chars, because 0.75 is already 4
  if (value.length > 4) {
    value = value.slice(0, 4);
  }

  return value;
};

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [stepLength, setStepLength] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);

  const req = useMemo(() => getPwReqState(password), [password]);
  const pwValid = useMemo(() => allOk(req), [req]);

  const showError = (msg: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: msg,
      position: 'top',
      topOffset: 100,
    });
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedLastname = lastname.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const fullName = `${trimmedName} ${trimmedLastname}`.trim();
    const stepLengthNumber = Number(stepLength);

    if (
      !trimmedName ||
      !trimmedLastname ||
      !trimmedEmail ||
      !stepLength ||
      !password ||
      !passwordConfirm
    ) {
      showError('Alle Felder sind Pflichtfelder!');
      setPwTouched(true);
      return;
    }

    if (!privacyPolicyAccepted) {
      showError('Bitte akzeptiere die Datenschutzerklärung.');
      return;
    }

    if (!Number.isFinite(stepLengthNumber) || stepLengthNumber <= 0) {
      showError('Bitte gib eine gültige Schrittlänge ein.');
      return;
    }

    const nameErrors = validateName(fullName);
    const emailErrors = validateEmail(trimmedEmail);
    const passwordErrors = validatePassword(password);

    const allErrors = [
      ...nameErrors,
      ...emailErrors,
      ...(password !== passwordConfirm
        ? ['Passwörter stimmen nicht überein!']
        : []),
      ...passwordErrors,
      ...(pwTouched && !pwValid
        ? ['Das Passwort erfüllt die Anforderungen noch nicht.']
        : []),
    ].filter(Boolean) as string[];

    if (allErrors.length > 0) {
      allErrors.forEach((err, i) => {
        setTimeout(() => showError(err), i * 900);
      });
      return;
    }

    setLoading(true);

    try {
      await createUser({
        email: trimmedEmail,
        password,
        passwordConfirm,
        name: fullName,
        stepLength: stepLengthNumber,
      });

      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Registrierung erfolgreich!',
        position: 'top',
        topOffset: 100,
      });

      router.replace('/login');
    } catch (error: any) {
      const apiMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Registrierung fehlgeschlagen!';

      showError(String(apiMsg));
      console.error('Register failed:', error?.response?.data ?? error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.card}>
            <Text style={styles.title}>Registrieren</Text>
            <Text style={styles.subtitle}>
              Erstelle dein Konto und starte mit Step Together.
            </Text>

            <View style={styles.nameRow}>
              <View style={styles.halfField}>
                <FieldLabel>VORNAME</FieldLabel>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Vorname"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              <View style={styles.halfField}>
                <FieldLabel>NACHNAME</FieldLabel>
                <TextInput
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder="Nachname"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <FieldLabel>E-MAIL</FieldLabel>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-Mail"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.fieldBlock}>
              <FieldLabel>SCHRITTLÄNGE</FieldLabel>
              <TextInput
                value={stepLength}
                onChangeText={(text) => setStepLength(sanitizeStepLengthInput(text))}
                placeholder="z. B. 0.75"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.input}
                keyboardType="decimal-pad"
                editable={!loading}
                maxLength={4}
              />
            </View>

            <PasswordField
              label="PASSWORT"
              value={password}
              onChangeText={(t: string) => {
                if (!pwTouched) setPwTouched(true);
                setPassword(t);
              }}
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              disabled={loading}
            />

            <View style={styles.requirementsBox}>
              <RequirementLine ok={req.minLen} text="Mindestens 8 Zeichen" />
              <RequirementLine ok={req.upper} text="Mindestens 1 Großbuchstabe" />
              <RequirementLine ok={req.digit} text="Mindestens 1 Zahl" />
            </View>

            <PasswordField
              label="PASSWORT BESTÄTIGEN"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              show={showPw2}
              onToggle={() => setShowPw2((v) => !v)}
              disabled={loading}
            />

            <Pressable
              onPress={() => setPrivacyPolicyAccepted((prev) => !prev)}
              style={styles.policyRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyPolicyAccepted }}
            >
              <View
                style={[
                  styles.checkbox,
                  privacyPolicyAccepted && styles.checkboxChecked,
                ]}
              >
                {privacyPolicyAccepted && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>

              <Text style={styles.policyText}>
                Ich akzeptiere die{' '}
                <Text
                  style={styles.policyLink}
                  onPress={() => setPolicyModalVisible(true)}
                  suppressHighlighting
                >
                  Datenschutzerklärung
                </Text>
              </Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => router.back()}
                disabled={loading}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryBtnText}>Zurück</Text>
              </Pressable>

              <Pressable
                onPress={handleRegister}
                disabled={loading || !privacyPolicyAccepted}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  (loading || !privacyPolicyAccepted) && styles.disabled,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Registriere…' : 'Weiter'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [styles.loginLink, pressed && styles.pressed]}
            >
              <Text style={styles.loginLinkText}>
                Bereits ein Konto? <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={policyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Datenschutzerklärung</Text>

              <Pressable
                onPress={() => setPolicyModalVisible(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
            >
              <Text style={styles.modalText}>{PRIVACY_POLICY_TEXT.trim()}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setPolicyModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Schließen</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setPrivacyPolicyAccepted(true);
                  setPolicyModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Akzeptieren</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logo: {
    width: 240,
    height: 130,
    alignSelf: 'center',
    marginBottom: 20,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  title: {
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },

  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },

  halfField: {
    flex: 1,
  },

  fieldBlock: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 8,
  },

  rowInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginLeft: 10,
  },

  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requirementsBox: {
    marginTop: -2,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  reqLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },

  reqText: {
    marginLeft: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
  },

  reqTextOk: {
    color: COLORS.ok,
  },

  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 6,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  policyText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },

  policyLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#fff',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  primaryBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  secondaryBtnText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 15,
  },

  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },

  loginLinkText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
  },

  loginLinkBold: {
    color: '#fff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },

  modalCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(94, 103, 81, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    maxHeight: '80%',
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },

  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {
    paddingHorizontal: 16,
  },

  modalBodyContent: {
    paddingVertical: 14,
  },

  modalText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonPrimary: {
    backgroundColor: COLORS.accent,
  },

  modalButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});