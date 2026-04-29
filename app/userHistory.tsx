import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getChallengeHistory } from './../services/challengeService.js';

type ModeFilter = 'all' | 'team' | 'individual';

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 26;

const COLORS = {
  bg: '#F4F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  android: { elevation: 3 },
});

export default function ChallengeHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getChallengeHistory();
          setHistory(data ?? []);
        } catch (err) {
          console.error('Failed to load challenge history:', err);
          setHistory([]);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [])
  );

  const filteredHistory = useMemo(() => {
    if (modeFilter === 'team') return history.filter((c) => c?.mode !== 'individual');
    if (modeFilter === 'individual') return history.filter((c) => c?.mode === 'individual');
    return history;
  }, [history, modeFilter]);

  const hasHistory = filteredHistory.length > 0;

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.centered}>
        <View style={styles.hero}>
          <View style={styles.accentLine} />
          <Text style={styles.heroTitle}>Verlauf</Text>
          <Text style={styles.heroSub}>
            Hier siehst du alle Challenges, an denen du bereits teilgenommen hast.
          </Text>

          <View style={styles.modeRow}>
            {(['all', 'team', 'individual'] as ModeFilter[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setModeFilter(key)}
                style={[styles.modeBtn, modeFilter === key && styles.modeBtnActive]}
              >
                <Text style={[styles.modeBtnText, modeFilter === key && styles.modeBtnTextActive]}>
                  {key === 'all' ? 'Alle' : key === 'team' ? 'Team' : 'Individuell'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }, [modeFilter]);

  const Empty = useMemo(() => {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Noch keine Challenges</Text>
          <Text style={styles.emptyText}>
            Du hast bisher an keiner Challenge teilgenommen.
          </Text>

          <Pressable
            onPress={() => router.push('/challenges/activeChallenges')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Zu den Challenges</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Verlauf…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!hasHistory ? Empty : null}
        renderItem={({ item }) => {
          const endLabel = item.endDate
            ? new Date(item.endDate).toLocaleDateString()
            : '-';

          return (
            <View style={styles.centered}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/challenges/details',
                    params: { id: String(item.id) },
                  })
                }
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{item.state}</Text>
                  </View>
                </View>

                <Text style={styles.cardLine} numberOfLines={2}>
                  {item.startLocation} <Text style={styles.dim}>→</Text>{' '}
                  {item.targetLocation}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Distanz</Text>
                    <Text style={styles.metaValue}>{item.distance} km</Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Beendet</Text>
                    <Text style={styles.metaValue}>{endLabel}</Text>
                  </View>
                </View>

                <Text style={styles.cardLink}>Teams & Ranking anzeigen ›</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  centered: {
    width: '100%',
    maxWidth: IS_WEB ? 960 : 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  loadingText: { fontSize: 13, color: COLORS.sub },

  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
    gap: 16,
  },

  hero: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 48,
    marginBottom: 16,
    ...(shadow ?? {}),
  },
  accentLine: {
    width: 140,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 15,
    color: COLORS.sub,
    lineHeight: 21,
  },

  emptyCard: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    padding: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...(shadow ?? {}),
  },
  emptyEmoji: { fontSize: 26, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // --- CARD ---
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(shadow ?? {}),
  },
  cardPressed: { opacity: 0.98, transform: [{ scale: 0.995 }] },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },

  statusPill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(85,128,92,0.22)',
  },
  statusText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 12,
  },

  cardLine: { fontSize: 14, color: COLORS.sub, lineHeight: 20 },
  dim: { color: 'rgba(15,20,17,0.45)' },

  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15,20,17,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.06)',
  },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: 'rgba(15,20,17,0.55)', marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  metaDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(15,20,17,0.08)',
    marginHorizontal: 10,
  },

  cardLink: { marginTop: 12, fontSize: 13, fontWeight: '700', color: COLORS.sub },

  modeRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F0F2F0',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: COLORS.sub,
  },
  modeBtnTextActive: {
    color: '#fff',
  },
});
