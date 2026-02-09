import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext';
import { makeAbsoluteMediaUrl } from '../services/userService';

type UserShape = {
  id?: number;
  name?: string;
  email?: string;
  stepLength?: number | null;
  avatarUrl?: string | null;
  avatar_url?: string | null; 
};

const COLORS = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  dim: '#7B877F',
  border: 'rgba(15,20,17,0.10)',
  accent: '#2E6B4F',
  accentSoft: '#E7F3EC',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 2 },
});

const getInitials = (name?: string) => {
  if (!name?.trim()) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const fmtStep = (v: number | null | undefined) => {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const asMeters = n >= 30 && n <= 200 ? n / 100 : n > 200 ? n / 1000 : n;
  return `${asMeters.toLocaleString('de-AT', { maximumFractionDigits: 2 })} m`;
};

const safeText = (v: any) => {
  const s = v == null ? '' : String(v);
  return s.trim().length ? s.trim() : '—';
};

const ProfileInfoScreen: React.FC = () => {
  const { user } = useUser() as { user: UserShape | null };

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const displayAvatarUri = useMemo(() => {
    const raw = (user?.avatarUrl ?? user?.avatar_url ?? '').toString().trim();
    if (!raw) return null;

    return makeAbsoluteMediaUrl(raw) ?? raw;
  }, [user?.avatarUrl, (user as any)?.avatar_url]);

  if (!user) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Profil…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header Card */}
        <View style={[styles.headerCard, shadow]}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarRing}>
<Avatar user={user} name={user?.name} size={86} />
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.title} numberOfLines={1}>
                {safeText(user.name)}
              </Text>
            </View>
          </View>
        </View>

        {/* DATA CARD */}
        <View style={[styles.card, shadow]}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Profildaten</Text>
          </View>

          {/* email full width */}
          <View style={styles.rowFull}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.accent} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.label}>E-Mail</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {safeText(user.email)}
                </Text>
              </View>
            </View>
          </View>

          {/* grid tiles */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.infoRow}>
                <View style={styles.iconBoxSoft}>
                  <Ionicons
                    name="finger-print-outline"
                    size={18}
                    color={COLORS.text}
                  />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.label}>User-ID</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {safeText(user.id)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={styles.infoRow}>
                <View style={styles.iconBoxSoft}>
                  <Ionicons name="walk-outline" size={18} color={COLORS.text} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.label}>Schrittlänge</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {fmtStep(user.stepLength ?? null)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfileInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(46,107,79,0.18)',
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#bac9baff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2933',
  },
  headerRight: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  rowFull: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(46,107,79,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(46,107,79,0.12)',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(15,20,17,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.06)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(46,107,79,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSoft: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(15,20,17,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  label: {
    fontSize: 11,
    color: COLORS.dim,
    marginBottom: 2,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
