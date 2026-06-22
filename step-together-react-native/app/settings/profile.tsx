import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import {
  getMe,
  makeAbsoluteMediaUrl,
  updateUser,
  uploadMyProfilePicture,
} from '../../services/userService';

const COLORS = {
  bg: '#fbfbfbff',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#66947aff',
  accentSoft: 'rgba(47,107,69,0.14)',
  tint: '#CFE0D3',
  inputBg: '#FAFBFA',
};

const pickAvatarFromUser = (u: any): string | null =>
  (u?.avatarUrl ?? u?.avatar_url ?? u?.avatar ?? null) as string | null;

const isPickedLocalUri = (uri: string) =>
  uri.startsWith('file://') || uri.startsWith('blob:') || uri.startsWith('data:');

const sanitizeDecimalInput = (raw: string) => {
  let v = String(raw ?? '').replace(/[^\d.,]/g, '');
  const firstSep = v.search(/[.,]/);
  if (firstSep !== -1) {
    const before = v.slice(0, firstSep + 1);
    const after = v.slice(firstSep + 1).replace(/[.,]/g, '');
    v = before + after;
  }
  return v;
};

const normalizeDecimal = (v: string) => String(v ?? '').trim().replace(',', '.');

export default function ProfileUpdateScreen() {
  const { user, setUser, userId } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stepLength, setStepLength] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    const sl =
      user.stepLength != null && !isNaN(Number(user.stepLength))
        ? String(user.stepLength)
        : '';
    setStepLength(sl);
    const avatar = pickAvatarFromUser(user);
    if (avatar) setImageUri(avatar);
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Zugriff benötigt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!userId) {
      Alert.alert('Error', 'Kein Benutzer gefunden.');
      return;
    }
    let parsedStepLength: number | null = null;
    if (stepLength.trim().length > 0) {
      const normalized = normalizeDecimal(stepLength);
      const num = Number(normalized);
      if (isNaN(num) || num <= 0) {
        Alert.alert('Fehler', 'Bitte eine gültige Schrittlänge eingeben.');
        return;
      }
      parsedStepLength = num;
    }
    setLoading(true);
    try {
      if (imageUri && isPickedLocalUri(imageUri)) {
        await uploadMyProfilePicture(imageUri);
      }
      const payload: any = { name, email };
      if (parsedStepLength !== null) payload.step_length = parsedStepLength;
      await updateUser(userId, payload);
      const freshUser = await getMe();
      if (freshUser) {
        setUser(freshUser);
        const newAvatar = pickAvatarFromUser(freshUser);
        const absoluteAvatar = newAvatar ? (makeAbsoluteMediaUrl(newAvatar) ?? newAvatar) : null;
        if (absoluteAvatar) setImageUri(absoluteAvatar);
      }
      Alert.alert('Gespeichert', 'Profil erfolgreich aktualisiert!');
      router.back();
    } catch (error: any) {
      let message = 'Benutzer konnte nicht aktualisiert werden';
      try {
        const detail = JSON.parse(error?.message);
        if (Array.isArray(detail) && detail[0]?.msg) {
          const field = detail[0]?.loc?.[1] ?? '';
          message = field ? `Feld „${field}": ${detail[0].msg}` : detail[0].msg;
        }
      } catch {
        if (error?.message && !error.message.startsWith('[')) message = error.message;
      }
      Alert.alert('Fehler beim Speichern', message);
    } finally {
      setLoading(false);
    }
  };

  const initials =
    name
      ?.split(' ')
      .filter(Boolean)
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '';

  const displayImageUri = useMemo(() => {
    if (!imageUri) return null;
    if (isPickedLocalUri(imageUri)) return imageUri;
    return makeAbsoluteMediaUrl(imageUri) ?? imageUri;
  }, [imageUri]);

  const canSave =
    !loading &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    (stepLength.trim().length === 0 || Number(normalizeDecimal(stepLength)) > 0);

  return (
    <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
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
            {/* HEADER */}
            <View style={styles.profileHeader}>
              <View style={styles.headerBand} />

              <Pressable
                style={({ pressed }) => [styles.avatarWrap, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={handlePickImage}
                disabled={loading}
              >
                <View style={styles.avatarRing}>
                  <View style={styles.avatarCircle}>
                    {displayImageUri ? (
                      <Image source={{ uri: displayImageUri }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarInitials}>{initials || '??'}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </Pressable>

              <Text style={styles.profileName}>{name || 'Dein Name'}</Text>
              <Text style={styles.subtitle}>{email || 'email@example.com'}</Text>
            </View>

            {/* FORM */}
            <View style={styles.formSection}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.sub} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    editable={!loading}
                    placeholder="Name"
                    placeholderTextColor="#9AA4A0"
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
                    style={styles.input}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="E-Mail"
                    placeholderTextColor="#9AA4A0"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Schrittlänge (Meter)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="walk-outline" size={18} color={COLORS.sub} />
                  <TextInput
                    value={stepLength}
                    onChangeText={(t) => setStepLength(sanitizeDecimalInput(t))}
                    style={styles.input}
                    editable={!loading}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="z.B. 0.78 oder 0,78"
                    placeholderTextColor="#9AA4A0"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleUpdate}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.savePressed,
                  !canSave && styles.saveDisabled,
                ]}
              >
                <Text style={styles.saveText}>
                  {loading ? 'Speichern…' : 'Änderungen speichern'}
                </Text>
              </Pressable>
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
  pressed: { opacity: 0.8 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 6,
  },

  profileHeader: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBand: {
    position: 'absolute',
    top: -60,
    left: -20,
    right: -20,
    height: 190,
    backgroundColor: COLORS.accent,
    opacity: 0.12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  avatarWrap: { marginTop: 6, marginBottom: 10 },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(47,107,69,0.18)',
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#DDE7DD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1F2A22',
    letterSpacing: 1,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },

  profileName: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginTop: 6 },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '700', color: '#667085' },

  formSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 14,
  },
  field: { width: '100%' },
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
    borderColor: 'rgba(15,20,17,0.10)',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#101828', paddingVertical: 0 },

  saveButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  savePressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  saveDisabled: { opacity: 0.55 },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});
