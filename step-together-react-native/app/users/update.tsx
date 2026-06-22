import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useUser } from '../../context/UserContext';
import { validateEmail, validateName, validateStepLength } from '../../lib/userValidation';
import { makeAbsoluteMediaUrl, updateUser } from '../../services/userService';

const sanitizeStepLengthInput = (raw: unknown): string => {
  let v = String(raw ?? '').replace(/[^\d.,]/g, '');
  const firstSepIndex = v.search(/[.,]/);
  if (firstSepIndex !== -1) {
    const before = v.slice(0, firstSepIndex + 1);
    const after = v.slice(firstSepIndex + 1).replace(/[.,]/g, '');
    v = before + after;
  }
  return v;
};

const normalizeStepLength = (v: unknown): string =>
  String(v ?? '').trim().replace(',', '.');

const pickAvatar = (u: any): string | null =>
  u?.avatarUrl ?? u?.avatar_url ?? u?.avatar ?? null;

const isLocalUri = (u: string): boolean =>
  u.startsWith('file://') || u.startsWith('blob:') || u.startsWith('data:');

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

export default function UpdateUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; email?: string; stepLength?: string; avatar?: string }>();
  const { user, setUser } = useUser() as any;

  const userId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    return raw != null ? Number(raw) : user?.id;
  }, [params?.id, user?.id]);

  const initialName = useMemo(() => {
    const raw = Array.isArray(params?.name) ? params.name[0] : params?.name;
    return raw ? String(raw) : (user?.name ?? '');
  }, [params?.name, user?.name]);

  const initialEmail = useMemo(() => {
    const raw = Array.isArray(params?.email) ? params.email[0] : params?.email;
    return raw ? String(raw) : (user?.email ?? '');
  }, [params?.email, user?.email]);

  const initialStepLength = useMemo(() => {
    const raw = Array.isArray(params?.stepLength) ? params.stepLength[0] : params?.stepLength;
    if (raw != null && raw !== '') return String(raw);
    const sl = user?.stepLength ?? user?.step_length;
    return sl != null ? String(sl) : '';
  }, [params?.stepLength, user?.stepLength, user?.step_length]);

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [stepLength, setStepLength] = useState(initialStepLength);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const paramAvatar = Array.isArray(params?.avatar) ? params.avatar[0] : params?.avatar;
    if (paramAvatar) {
      setImageUri(paramAvatar);
    } else if (userId === user?.id) {
      const av = pickAvatar(user);
      if (av) setImageUri(av);
    }
  }, []);

  const displayImageUri = useMemo(() => {
    if (!imageUri) return null;
    if (isLocalUri(imageUri)) return imageUri;
    return makeAbsoluteMediaUrl(imageUri) ?? imageUri;
  }, [imageUri]);

  const initials = useMemo(() => {
    const n = (name ?? '').trim();
    if (!n) return '??';
    const parts = n.split(' ').filter(Boolean);
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
  }, [name]);

  const showError = (msg: string) => {
    Toast.show({ type: 'error', text1: 'Fehler', text2: String(msg), position: 'top', topOffset: 100 });
  };

  const stepLengthNormalized = useMemo(() => normalizeStepLength(stepLength), [stepLength]);

  const handleUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !stepLengthNormalized) {
      showError('Alle Felder sind Pflichtfelder!');
      return;
    }

    const allErrors = [
      ...validateEmail(trimmedEmail),
      ...validateName(trimmedName),
      ...validateStepLength(stepLengthNormalized),
    ].filter(Boolean);

    if (allErrors.length > 0) {
      allErrors.forEach((err, i) => setTimeout(() => showError(err), i * 900));
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateUser(userId, {
        name: trimmedName,
        email: trimmedEmail,
        stepLength: parseFloat(stepLengthNormalized),
      });

      if (user && userId === user.id) setUser(updatedUser);

      Toast.show({ type: 'success', text1: 'Gespeichert', text2: 'Dein Profil wurde aktualisiert.', position: 'top', topOffset: 100 });
      router.back();
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Profil konnte nicht aktualisiert werden'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={() => router.back()}
              disabled={loading}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </Pressable>
            <View style={{ width: 44, height: 44 }} />
          </View>

          <View style={styles.card}>
            <View style={styles.headerBlock}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarCircle}>
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.headerTitle}>Profil bearbeiten</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={COLORS.sub} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Vor- und Nachname"
                  placeholderTextColor="#9AA4A0"
                  style={styles.input}
                  editable={!loading}
                  autoCapitalize="words"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-Mail</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.sub} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="deine@email.com"
                  placeholderTextColor="#9AA4A0"
                  style={styles.input}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Schrittlänge (in cm)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="walk-outline" size={18} color={COLORS.sub} />
                <TextInput
                  value={stepLength}
                  onChangeText={(t) => setStepLength(sanitizeStepLengthInput(t))}
                  placeholder="z.B. 75"
                  placeholderTextColor="#9AA4A0"
                  style={styles.input}
                  editable={!loading}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  returnKeyType="done"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (!name.trim() || !email.trim() || loading) && styles.disabled]}
              disabled={loading || !name.trim() || !email.trim()}
              onPress={handleUpdate}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.buttonText}>Speichern</Text>}
            </Pressable>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#111" />
              <Text style={styles.infoText}>
                Änderungen werden sofort in deinem Profil sichtbar.
              </Text>
            </View>
          </View>

          <View style={{ height: 22 }} />
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 120 },

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
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.tint,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarInitials: { fontSize: 24, fontWeight: '900', color: '#2F4A35' },
  cameraTag: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  headerHint: { fontSize: 12, color: COLORS.sub, marginTop: 4, fontWeight: '500' },

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

  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.2 },
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
  infoText: { flex: 1, fontSize: 12, color: '#111', lineHeight: 16, fontWeight: '600' },
});
