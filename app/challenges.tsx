import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChallengeCard from '../components/ChallengeCard';
import { getChallenges } from '../services/challengeService';

type Challenge = {
  id: number | string;
  state?: string | null;
  [key: string]: any;
};

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 26;

export default function OpenChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const skipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const limit = 10;
  const router = useRouter();

  const visibleChallenges = useMemo(
    () => challenges.filter((c) => ['open', 'incoming'].includes(String(c?.state ?? ''))),
    [challenges]
  );

  const loadChallenges = useCallback(
    async (isInitial = false) => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;

      loadingMoreRef.current = true;
      if (isInitial) setLoadingInitial(true);
      else setLoadingMore(true);

      try {
        const data = await getChallenges(skipRef.current, limit);
        const safe: Challenge[] = Array.isArray(data) ? data : [];

        setChallenges((prev) => (isInitial ? safe : [...prev, ...safe]));
        skipRef.current += safe.length;

        if (safe.length < limit) hasMoreRef.current = false;
      } catch (err) {
        console.error('Failed to load challenges:', err);
      } finally {
        loadingMoreRef.current = false;
        if (isInitial) setLoadingInitial(false);
        else setLoadingMore(false);
      }
    },
    [limit]
  );

  useFocusEffect(
    useCallback(() => {
      skipRef.current = 0;
      hasMoreRef.current = true;
      loadingMoreRef.current = false;

      setChallenges([]);
      void loadChallenges(true);
    }, [loadChallenges])
  );

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.centered}>
        <View style={styles.hero}>
          <View style={styles.accentLine} />
          <Text style={styles.heroTitle}>Challenges</Text>
          <Text style={styles.heroSub}>
            Offene & kommende Wettbewerbe. Beweg dich gemeinsam mit anderen.
          </Text>

          <View style={styles.heroRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{visibleChallenges.length} aktiv</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [visibleChallenges.length]);

  const Empty = useMemo(() => {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🫥</Text>
          <Text style={styles.emptyTitle}>Keine Challenges</Text>
          <Text style={styles.emptyText}>
            Momentan sind keine offenen oder kommenden Challenges verfügbar.
          </Text>
        </View>
      </View>
    );
  }, []);

  if (loadingInitial && challenges.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <View pointerEvents="none" style={styles.bgBlobA} />
        <View pointerEvents="none" style={styles.bgBlobB} />
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Challenges…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleChallenges}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={() => void loadChallenges(false)}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loadingInitial ? Empty : null}
        renderItem={({ item }) => (
          <View style={styles.centered}>
            <View style={styles.cardSurface}>
              <ChallengeCard
                challenge={item}
                onPress={() =>
                  router.push({
                    pathname: '/allChallenges/details',
                    params: { id: String(item.id) },
                  })
                }
                onUpdate={() => {}}
                onDelete={() => {}}
                showActions={false}
              />
            </View>
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 28 }} />
          ) : (
            <View style={{ height: 32 }} />
          )
        }
      />
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  centered: {
    width: '100%',
    maxWidth: IS_WEB ? 960 : 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },

  // Background decor
  bgBlobA: {
    position: 'absolute',
    top: -60,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 140,
    backgroundColor: 'rgba(85,128,92,0.10)',
  },
  bgBlobB: {
    position: 'absolute',
    bottom: -110,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 170,
    backgroundColor: 'rgba(15,20,17,0.06)',
  },

  // Loading
  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  loadingText: { fontSize: 13, color: COLORS.sub },

  // List
  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
    gap: 16,
  },

  // Hero
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
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  badgeSoft: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15,20,17,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeSoftText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.sub,
  },

  // Cards
  cardSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...(shadow ?? {}),
  },

  // Empty
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
  emptyEmoji: { fontSize: 30, marginBottom: 10 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
});
