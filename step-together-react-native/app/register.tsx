import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useMemo, useRef, useState } from 'react';
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
import { registerUser } from '../services/userService';

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
  textContentType?: 'none' | 'password' | 'newPassword';
  autoComplete?: 'password' | 'new-password' | 'off';
  passwordRules?: string;
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
};

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
  textContentType = 'password',
  autoComplete = 'password',
  passwordRules,
  returnKeyType,
  onSubmitEditing,
}: PasswordFieldProps) => {
  const hasValue = value.length > 0;

  return (
    <View style={styles.fieldBlock}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color="#fff" />
        <TextInput
          // FIX: Unique key forces remount on toggle, killing the iOS "Strong Password" freeze
          key={show ? 'pw_visible' : 'pw_hidden'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          editable={!disabled}
          style={styles.rowInput}
          placeholderTextColor="rgba(255,255,255,0.55)"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={textContentType}
          autoComplete={autoComplete}
          passwordRules={passwordRules}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          importantForAutofill="yes"
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

const getPwReqState = (pw: string) => ({
  minLen: pw.length >= 12,
  upper: /[A-Z]/.test(pw),
  digit: /\d/.test(pw),
});

const RequirementLine = ({ ok, text }: { ok: boolean; text: string }) => (
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
  if (value.length > 4) value = value.slice(0, 4);
  return value;
};

export default function RegisterScreen() {
  const router = useRouter();

  const lastnameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const stepRef = useRef<TextInput>(null);

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
  const pwValid = useMemo(() => req.minLen && req.upper && req.digit, [req]);

  const showError = (msg: string) => {
    Toast.show({
      type: 'error',
      text1: 'Fehler',
      text2: msg,
      position: 'top',
      topOffset: 60,
    });
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedLastname = lastname.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const rawPassword = password;
    const rawPasswordConfirm = passwordConfirm;
    const fullName = `${trimmedName} ${trimmedLastname}`.trim();
    const stepLengthNumber = Number(stepLength);

    if (
      !trimmedName ||
      !trimmedLastname ||
      !normalizedEmail ||
      !stepLength ||
      !rawPassword ||
      !rawPasswordConfirm
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
    const emailErrors = validateEmail(normalizedEmail);
    const passwordErrors = validatePassword(rawPassword);

    const allErrors = [
      ...nameErrors,
      ...emailErrors,
      ...(rawPassword !== rawPasswordConfirm
        ? ['Passwörter stimmen nicht überein!']
        : []),
      ...passwordErrors,
      ...(pwTouched && !pwValid ? ['Das Passwort erfüllt die Anforderungen noch nicht.'] : []),
    ].filter(Boolean) as string[];

    if (allErrors.length > 0) {
      Toast.hide();
      allErrors.forEach((err, i) => {
        setTimeout(() => showError(err), i * 500);
      });
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: normalizedEmail,
        password: rawPassword,
        passwordConfirm: rawPasswordConfirm,
        name: fullName,
        stepLength: stepLengthNumber,
        privacyPolicyAccepted,
      });

      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Registrierung erfolgreich!',
      });

      router.replace('/verifyInfo');
    } catch (error: any) {
      const apiMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Registrierung fehlgeschlagen!';
      showError(String(apiMsg));
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
                  autoComplete="name-given"
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastnameRef.current?.focus()}
                />
              </View>

              <View style={styles.halfField}>
                <FieldLabel>NACHNAME</FieldLabel>
                <TextInput
                  ref={lastnameRef}
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder="Nachname"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.input}
                  editable={!loading}
                  autoComplete="name-family"
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <FieldLabel>E-MAIL</FieldLabel>
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="E-Mail"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false} // Crucial for preventing iOS input conflict
                editable={!loading}
                autoComplete="email"
                // FIX: textContentType="emailAddress" tells iOS this is the ID for the new account
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => stepRef.current?.focus()}
                importantForAutofill="yes"
              />
            </View>

            <View style={styles.fieldBlock}>
              <FieldLabel>SCHRITTLÄNGE (m)</FieldLabel>
              <TextInput
                ref={stepRef}
                value={stepLength}
                onChangeText={(text) => setStepLength(sanitizeStepLengthInput(text))}
                placeholder="z. B. 0.75"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.input}
                keyboardType="decimal-pad"
                editable={!loading}
                maxLength={4}
                returnKeyType="next"
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
              textContentType="newPassword"
              autoComplete="new-password"
              passwordRules="minlength: 12; required: upper; required: digit;"
              returnKeyType="next"
            />

            <View style={styles.requirementsBox}>
              <RequirementLine ok={req.minLen} text="Mindestens 12 Zeichen" />
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
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Pressable
              onPress={() => setPrivacyPolicyAccepted((prev) => !prev)}
              style={styles.policyRow}
            >
              <View style={[styles.checkbox, privacyPolicyAccepted && styles.checkboxChecked]}>
                {privacyPolicyAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.policyText}>
                Ich akzeptiere die{' '}
                <Text
                  style={styles.policyLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    setPolicyModalVisible(true);
                  }}
                >
                  Datenschutzerklärung
                </Text>
              </Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryBtnText}>Zurück</Text>
              </Pressable>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
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

            <Pressable onPress={() => router.push('/login')} style={styles.loginLink}>
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
              <Pressable onPress={() => setPolicyModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{PRIVACY_POLICY_TEXT.trim()}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable style={styles.modalButtonSecondary} onPress={() => setPolicyModalVisible(false)}>
                <Text style={styles.modalButtonText}>Schließen</Text>
              </Pressable>
              <Pressable
                style={styles.modalButtonPrimary}
                onPress={() => { setPrivacyPolicyAccepted(true); setPolicyModalVisible(false); }}
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
  background: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 40 },
  logo: { width: 240, height: 130, alignSelf: 'center', marginBottom: 20 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 24, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  title: { fontSize: 28, color: COLORS.text, textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  subtitle: { fontSize: 14, color: COLORS.sub, textAlign: 'center', marginBottom: 22 },
  nameRow: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldBlock: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.inputBg, color: COLORS.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, borderWidth: 1, borderColor: COLORS.inputBorder },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 10, paddingLeft: 14, borderWidth: 1, borderColor: COLORS.inputBorder },
  rowInput: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, marginLeft: 10 },
  eyeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  requirementsBox: { marginBottom: 12 },
  reqLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  reqText: { marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  reqTextOk: { color: COLORS.ok },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  policyText: { color: '#fff', fontSize: 14, flex: 1 },
  policyLink: { fontWeight: '700', textDecorationLine: 'underline' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { color: '#fff' },
  loginLinkBold: { fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#4a5240', borderRadius: 15, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#fff', fontWeight: '700' },
  modalBody: { padding: 15 },
  modalText: { color: '#fff', lineHeight: 20 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 15 },
  modalButtonPrimary: { flex: 1, backgroundColor: COLORS.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
  modalButtonSecondary: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '700' },
});