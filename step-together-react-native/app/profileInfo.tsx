import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { getMe, makeAbsoluteMediaUrl, uploadMyProfilePicture } from '../services/userService';

const C = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  dim: '#7B877F',
  border: 'rgba(15,20,17,0.10)',
  accent: '#6B8F71',
  cover: '#D8E8DB',
};

const pickAvatar = (u: any): string | null =>
  (u?.avatarUrl ?? u?.avatar_url ?? u?.avatar ?? null) as string | null;

const isLocalUri = (u: string) =>
  u.startsWith('file://') || u.startsWith('blob:') || u.startsWith('data:');

const fmtStep = (v: any) => {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const m = n >= 30 && n <= 200 ? n / 100 : n > 200 ? n / 1000 : n;
  return `${m.toLocaleString('de-AT', { maximumFractionDigits: 2 })} m`;
};

const safeStr = (v: any) => {
  const s = v == null ? '' : String(v).trim();
  return s.length ? s : '—';
};

export default function ProfileInfoScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const av = pickAvatar(user);
    if (av) setImageUri(av);
  }, [user]);

  const displayImageUri = useMemo(() => {
    if (!imageUri) return null;
    if (isLocalUri(imageUri)) return imageUri;
    return makeAbsoluteMediaUrl(imageUri) ?? imageUri;
  }, [imageUri]);

  const initials = useMemo(() => {
    const n = (user?.name ?? '').trim();
    if (!n) return '??';
    const parts = n.split(' ').filter(Boolean);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  }, [user?.name]);

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

  const cardShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 3 },
  });

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Cover + Avatar ─────────────────────────────────────────── */}
        <View style={[styles.coverSection, { paddingTop: insets.top + 20 }]}>
          <View style={styles.coverBand} />

          <Pressable
            onPress={handlePickImage}
            disabled={uploading}
            style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.avatarOuter}>
              <View style={styles.avatarCircle}>
                {displayImageUri ? (
                  <Image source={{ uri: displayImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>
            </View>

            <View style={styles.cameraBadge}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={17} color="#fff" />}
            </View>
          </Pressable>

          <Text style={styles.profileName}>{safeStr(user?.name)}</Text>
          <Text style={styles.profileEmail}>{safeStr(user?.email)}</Text>
        </View>

        {/* ── Info tiles ─────────────────────────────────────────────── */}
        <View style={[styles.card, cardShadow]}>
          <Text style={styles.cardTitle}>Profildaten</Text>

          {/* email full row */}
          <View style={styles.infoRowFull}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={C.accent} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>E-Mail</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{safeStr(user?.email)}</Text>
            </View>
          </View>

          {/* grid */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.infoIconBoxSoft}>
                <Ionicons name="finger-print-outline" size={18} color={C.text} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>User-ID</Text>
                <Text style={styles.infoValue}>{safeStr(user?.id)}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={styles.infoIconBoxSoft}>
                <Ionicons name="walk-outline" size={18} color={C.text} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Schrittlänge</Text>
                <Text style={styles.infoValue}>{fmtStep(user?.stepLength ?? user?.step_length)}</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  coverSection: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 16,
    position: 'relative',
  },
  coverBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: C.cover,
    opacity: 0.65,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  avatarWrap: { marginBottom: 14, position: 'relative' },
  avatarOuter: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  avatarCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#D8E8DB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 38, fontWeight: '900', color: '#2F4A35', letterSpacing: 1 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  profileName: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 4 },
  profileEmail: { fontSize: 14, fontWeight: '600', color: C.sub, textAlign: 'center' },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.10)',
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.text },

  infoRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(107,143,113,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(107,143,113,0.12)',
  },
  grid: { flexDirection: 'row', gap: 10 },
  gridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(15,20,17,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.06)',
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(107,143,113,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconBoxSoft: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(15,20,17,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.dim, marginBottom: 2, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },
});
