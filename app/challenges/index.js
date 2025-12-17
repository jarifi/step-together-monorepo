import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChallengeCard from '../../components/ChallengeCard';
import { getChallenges } from '../../services/challengeService';

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 26;

export default function OpenChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  const visibleChallenges = useMemo(
    () => challenges.filter(c => ['open', 'incoming'].includes(c.state)),
    [challenges]
  );

  const loadChallenges = async () => {
    if (loadingMore || !hasMore) return;

    const isInitial = challenges.length === 0;
    isInitial ? setLoadingInitial(true) : setLoadingMore(true);

    try {
      const data = await getChallenges(skip, limit);
      const safe = Array.isArray(data) ? data : [];

      setChallenges(prev => [...prev, ...safe]);
      setSkip(prev => prev + safe.length);

      if (safe.length < limit) setHasMore(false);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      isInitial ? setLoadingInitial(false) : setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setChallenges([]);
      setHasMore(true);
      loadChallenges();
    }, [])
  );

  if (loadingInitial && challenges.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Challenges…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleChallenges}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={loadChallenges}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.centered}>
            <View style={styles.hero}>
              <View style={styles.accentLine} />
              <Text style={styles.heroTitle}>Challenges</Text>
              <Text style={styles.heroSub}>
                Offene & kommende Wettbewerbe. Beweg dich gemeinsam mit anderen.
              </Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {visibleChallenges.length} aktiv
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.centered}>
            <View style={styles.cardSurface}>
              <ChallengeCard
                challenge={item}
                onPress={() =>
                  router.push({
                    pathname: '/allChallenges/details',
                    params: { id: item.id.toString() },
                  })
                }
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🫥</Text>
              <Text style={styles.emptyTitle}>Keine Challenges</Text>
              <Text style={styles.emptyText}>
                Momentan sind keine offenen oder kommenden Challenges verfügbar.
              </Text>
            </View>
          </View>
        }
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ✅ ONE shared width for hero + cards
  centered: {
    width: '100%',
    maxWidth: IS_WEB ? 960 : 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },

  // ---------- LOADING ----------
  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: COLORS.sub,
  },

  // ---------- HERO ----------
  hero: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 48,
    marginBottom: 16,
    ...shadow,
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

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // ---------- LIST ----------
  listContent: {
    paddingBottom: 32,
    gap: 16,
  },

  // ✅ SAME radius as hero
  cardSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...shadow,
  },

  // ---------- EMPTY ----------
  emptyCard: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    padding: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...shadow,
  },

  emptyEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },

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
  },
});
