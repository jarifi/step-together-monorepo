import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useUser } from '../../context/UserContext';
import { validateEmail, validateName, validateStepLength } from '../../lib/userValidation';
import { updateUser } from '../../services/userService';

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
const normalizeStepLength = (v) => String(v ?? '').trim().replace(',', '.');

// ====== UI tokens ======
const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  inputBg: '#FBFCFB',
};

const FieldLabel = ({ children }) => <Text style={styles.label}>{children}</Text>;

export default function UpdateUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setUser } = useUser();

  const userId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    return Number(raw);
  }, [params?.id]);

  const initialName = useMemo(() => {
    const raw = Array.isArray(params?.name) ? params.name[0] : params?.name;
    return String(raw ?? '');
  }, [params?.name]);

  const initialEmail = useMemo(() => {
    const raw = Array.isArray(params?.email) ? params.email[0] : params?.email;
    return String(raw ?? '');
  }, [params?.email]);

  const initialStepLength = useMemo(() => {
    const raw = Array.isArray(params?.stepLength) ? params.stepLength[0] : params?.stepLength;
    return raw == null ? '' : String(raw);
  }, [params?.stepLength]);

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [stepLength, setStepLength] = useState(initialStepLength);
  const [loading, setLoading] = useState(false);

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

  const handleUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !stepLengthNormalized) {
      showError('Alle Felder sind Pflichtfelder!');
      return;
    }

    const emailErrors = validateEmail(trimmedEmail);
    const nameErrors = validateName(trimmedName);
    const stepLengthErrors = validateStepLength(stepLengthNormalized);

    const allErrors = [...emailErrors, ...nameErrors, ...stepLengthErrors].filter(Boolean);

    if (allErrors.length > 0) {
      allErrors.forEach((err, i) => setTimeout(() => showError(err), i * 900));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        stepLength: parseFloat(stepLengthNormalized),
      };

      const updatedUser = await updateUser(userId, payload);

      if (user && userId === user.id) {
        setUser(updatedUser);
      }

      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Benutzer erfolgreich aktualisiert!',
        position: 'top',
        topOffset: 100,
      });

      router.back();
    } catch (error) {
      const apiMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Benutzer konnte nicht aktualisiert werden';

      showError(apiMsg);
      console.error('Update user failed:', error?.response?.data ?? error);
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
          {/* Header Card */}
          <View style={styles.headerCard}>
            <Text style={styles.title}>Benutzer bearbeiten</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <FieldLabel>NAME</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Vor- und Nachname"
              placeholderTextColor="#8A9590"
              style={styles.input}
              editable={!loading}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <FieldLabel>E-MAIL</FieldLabel>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-Mail"
              placeholderTextColor="#8A9590"
              style={styles.input}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <FieldLabel>SCHRITTLÄNGE</FieldLabel>
            <TextInput
              value={stepLength}
              onChangeText={(t) => setStepLength(sanitizeStepLengthInput(t))}
              placeholder="Schrittlänge (in cm)"
              placeholderTextColor="#8A9590"
              style={styles.input}
              editable={!loading}
              keyboardType="decimal-pad"
              inputMode="decimal"
              returnKeyType="done"
            />

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => router.back()}
                disabled={loading}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.pressed,
                  loading && styles.disabled,
                ]}
              >
                <Text style={styles.secondaryBtnText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                onPress={handleUpdate}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  loading && styles.disabled,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Aktualisiere…' : 'Aktualisieren'}
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
    position: 'relative',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 56,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.sub,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
