import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChallengeCard from '../../components/ChallengeCard';
import { getChallenges } from '../../services/challengeService';

const { height: screenHeight } = Dimensions.get('window');

export default function OpenChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const visibleChallenges = useMemo(
    () => challenges.filter((c) => ['open', 'incoming'].includes(c.state)),
    [challenges]
  );

  const loadChallenges = async () => {
    if (loadingMore || !hasMore) return;

    const isInitial = challenges.length === 0;
    if (isInitial) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const data = await getChallenges(skip, limit);
      const safe = Array.isArray(data) ? data : [];

      setChallenges((prev) => [...prev, ...safe]);
      setSkip((prev) => prev + safe.length);

      if (safe.length < limit) setHasMore(false);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      if (isInitial) setLoadingInitial(false);
      else setLoadingMore(false);
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
      {/* Header Card */}
      <View style={[styles.content, styles.headerCard]}>
        <Text style={styles.title}>Offene & kommende Challenges</Text>
        <Text style={styles.sub}>
          Tippe auf eine Challenge, um Details, Teams und das Ranking zu sehen.
        </Text>
      </View>

      <FlatList
        data={visibleChallenges}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={loadChallenges}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.content}>
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
        )}
        ListEmptyComponent={
          <View style={[styles.content, styles.emptyCard]}>
            <Text style={styles.emptyEmoji}>🫥</Text>
            <Text style={styles.emptyTitle}>Keine Challenges gerade</Text>
            <Text style={styles.emptyText}>
              Derzeit sind keine offenen oder kommenden Challenges vorhanden.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ margin: 16 }} />
          ) : (
            <View style={{ height: 6 }} />
          )
        }
        ListFooterComponentStyle={{ paddingBottom: 12 }}
        style={{ flex: 1, minHeight: screenHeight - 180 }}
      />
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 60,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  // ---------------- LOADING ----------------
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

  // ---------------- HEADER ----------------
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...shadow,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
  },

  sub: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
    textAlign: 'center',
  },

  // ---------------- LIST ----------------
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
    gap: 12,
  },

  // ---------------- EMPTY ----------------
  emptyCard: {
    marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...shadow,
  },

  emptyEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
