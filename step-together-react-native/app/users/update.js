import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { getMe, makeAbsoluteMediaUrl, updateUser, uploadMyProfilePicture } from '../../services/userService';

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

const pickAvatar = (u) => u?.avatarUrl ?? u?.avatar_url ?? u?.avatar ?? null;
const isLocalUri = (u) => u.startsWith('file://') || u.startsWith('blob:') || u.startsWith('data:');

export default function UpdateUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setUser } = useUser();

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
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const av = pickAvatar(user);
    if (av) setImageUri(av);
  }, [user]);

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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Zugriff benötigt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;

    const uri = res.assets[0].uri;
    setImageUri(uri);
    setUploading(true);
    try {
      await uploadMyProfilePicture(uri);
      const fresh = await getMe();
      if (fresh) {
        setUser(fresh);
        const av = pickAvatar(fresh);
        const abs = av ? (makeAbsoluteMediaUrl(av) ?? av) : null;
        if (abs) setImageUri(abs);
      }
    } catch {
      Alert.alert('Fehler', 'Foto konnte nicht hochgeladen werden.');
      const av = pickAvatar(user);
      setImageUri(av ? (makeAbsoluteMediaUrl(av) ?? av) : null);
    } finally {
      setUploading(false);
    }
  };

  const showError = (msg) => {
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
    } catch (error) {
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
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />

            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>

            <Pressable
              onPress={handlePickImage}
              disabled={uploading}
              style={({ pressed }) => [styles.avatarContainer, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.avatarRing}>
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
              <View style={styles.cameraTag}>
                {uploading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={14} color="#fff" />}
              </View>
            </Pressable>

            <Text style={styles.heroTitle}>Profil bearbeiten</Text>
            <Text style={styles.heroHint}>Tippe auf das Foto zum Ändern</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Persönliche Daten</Text>

            <View style={styles.formCard}>
              <FieldRow icon="person-outline" label="Name">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Vor- und Nachname"
                  placeholderTextColor="#AEBAB3"
                  style={styles.fieldInput}
                  editable={!loading}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </FieldRow>

              <View style={styles.fieldDivider} />

              <FieldRow icon="mail-outline" label="E-Mail">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="deine@email.com"
                  placeholderTextColor="#AEBAB3"
                  style={styles.fieldInput}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </FieldRow>

              <View style={styles.fieldDivider} />

              <FieldRow icon="walk-outline" label="Schrittlänge (cm)">
                <TextInput
                  value={stepLength}
                  onChangeText={(t) => setStepLength(sanitizeStepLengthInput(t))}
                  placeholder="z.B. 75"
                  placeholderTextColor="#AEBAB3"
                  style={styles.fieldInput}
                  editable={!loading}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  returnKeyType="done"
                />
              </FieldRow>
            </View>
          </View>

          {/* ── Buttons ── */}
          <View style={styles.buttonSection}>
            <Pressable
              onPress={handleUpdate}
              disabled={loading}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, loading && styles.disabled]}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Speichern</Text>}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed, loading && styles.disabled]}
            >
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldRow({ icon, label, children }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldMeta}>
        <Ionicons name={icon} size={17} color="#6B8F71" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F1' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  /* ── Hero ── */
  hero: {
    backgroundColor: '#5A7D60',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#2E5034', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 10 },
    }),
  },
  heroBlob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -50,
  },
  heroBlob2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10,
    left: -30,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  avatarContainer: { marginTop: 24, marginBottom: 12, position: 'relative' },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#C8DDCB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#2F4A35' },
  cameraTag: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3D6644',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.2, marginBottom: 4 },
  heroHint: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  /* ── Form section ── */
  formSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A9590',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.07)',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },

  fieldRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  fieldMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6B8F71', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    fontSize: 16,
    color: '#0F1411',
    fontWeight: '500',
    paddingVertical: 6,
    paddingBottom: 12,
  },
  fieldDivider: { height: 1, backgroundColor: 'rgba(15,20,17,0.07)', marginHorizontal: 16 },

  /* ── Buttons ── */
  buttonSection: { marginHorizontal: 16, gap: 10 },
  saveBtn: {
    backgroundColor: '#5A7D60',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: { shadowColor: '#2E5034', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 4 },
    }),
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  cancelBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.10)',
  },
  cancelBtnText: { color: '#55605A', fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
