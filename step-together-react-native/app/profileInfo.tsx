import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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
import { getUserRole, removeTokens } from '../lib/auth';
import { getMe, makeAbsoluteMediaUrl, uploadMyProfilePicture } from '../services/userService';

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
  const { user, setUser, setToken, setUserId } = useUser();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getUserRole().then(role => setIsAdmin(role === 'admin'));
  }, []);

  const handleLogout = async () => {
    await removeTokens();
    setUser(null);
    setToken(null);
    setUserId(null);
    router.replace('/login');
  };

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

    const pickedAsset = res.assets[0];
    const uri = pickedAsset.uri;
    setImageUri(uri);
    setUploading(true);
    try {
      await uploadMyProfilePicture(pickedAsset);
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

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ── Hero cover ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          {/* Decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {/* Avatar */}
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
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={styles.heroName}>{safeStr(user?.name)}</Text>
          <Text style={styles.heroEmail}>{safeStr(user?.email)}</Text>

          {/* Stats ribbon */}
          <View style={styles.statsRibbon}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{safeStr(user?.id)}</Text>
              <Text style={styles.statLabel}>User-ID</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fmtStep(user?.stepLength ?? user?.step_length)}</Text>
              <Text style={styles.statLabel}>Schrittlänge</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto verwalten</Text>

          <View style={styles.actionCard}>
            <ActionRow
              icon="edit"
              iconColor="#6B8F71"
              iconBg="rgba(107,143,113,0.12)"
              label="Profil bearbeiten"
              onPress={() => router.push('/users/update' as any)}
            />
            <View style={styles.rowDivider} />
            <ActionRow
              icon="lock-outline"
              iconColor="#6B8F71"
              iconBg="rgba(107,143,113,0.12)"
              label="Passwort ändern"
              onPress={() => router.push('/settings/password')}
            />
            <View style={styles.rowDivider} />
            <ActionRow
              icon="info-outline"
              iconColor="#6B8F71"
              iconBg="rgba(107,143,113,0.12)"
              label="Hilfe & Support"
              onPress={() => router.push('/help/start')}
            />
          </View>
        </View>

        {/* ── Admin ── */}
        {isAdmin && (
          <View style={[styles.section, { marginTop: 4 }]}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <View style={styles.actionCard}>
              <ActionRow
                icon="admin-panel-settings"
                iconColor="#5A7D60"
                iconBg="rgba(90,125,96,0.12)"
                label="Admin Bereich"
                onPress={() => router.push('/admin' as any)}
              />
            </View>
          </View>
        )}

        {/* ── Danger zone ── */}
        <View style={[styles.section, { marginTop: 4 }]}>
          <Text style={styles.sectionTitle}>Gefahrenzone</Text>
          <View style={styles.actionCard}>
            <ActionRow
              icon="delete-outline"
              iconColor="#DC2626"
              iconBg="rgba(220,38,38,0.10)"
              label="Account löschen"
              labelColor="#DC2626"
              onPress={() => router.push('/settings/userDelete')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ActionRow({
  icon,
  iconColor,
  iconBg,
  label,
  labelColor,
  onPress,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  labelColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
    >
      <View style={[styles.actionIconBox, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.actionLabel, labelColor ? { color: labelColor } : {}]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color="#C0C8C2" style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F1' },

  /* ── Hero ── */
  hero: {
    backgroundColor: '#5A7D60',
    alignItems: 'center',
    paddingBottom: 0,
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
  blob1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -60,
  },
  blob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 40,
    left: -40,
  },
  /* Avatar */
  avatarContainer: { marginTop: 24, marginBottom: 16, position: 'relative' },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#C8DDCB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 38, fontWeight: '900', color: '#2F4A35' },
  cameraTag: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3D6644',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  heroName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },

  /* Stats ribbon */
  statsRibbon: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.62)', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  /* ── Sections ── */
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A9590',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },

  /* Action card */
  actionCard: {
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  actionRowPressed: { backgroundColor: '#F6FAF7' },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#0F1411' },
  rowDivider: { height: 1, backgroundColor: 'rgba(15,20,17,0.06)', marginLeft: 68 },
});
