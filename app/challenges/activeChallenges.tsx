import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChallengeCard from '../../components/ChallengeCard';
import { getChallenges } from '../../services/challengeService';

type Challenge = {
  id: number | string;
  state?: string | null;
  [key: string]: any;
};

type TabKey = 'active' | 'incoming' | 'closed';

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

const DETAILS_PATH = '/challenges/details';

export default function OpenChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<TabKey>('active');

  const skipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const limit = 10;
  const router = useRouter();

  const activeChallenges = useMemo(
    () => challenges.filter((c) => String(c?.state ?? '') === 'open'),
    [challenges]
  );

  const incomingChallenges = useMemo(
    () => challenges.filter((c) => String(c?.state ?? '') === 'incoming'),
    [challenges]
  );

  const closedChallenges = useMemo(
    () => challenges.filter((c) => String(c?.state ?? '') === 'closed'),
    [challenges]
  );

  const visibleChallenges = useMemo(() => {
    if (tab === 'active') return activeChallenges;
    if (tab === 'incoming') return incomingChallenges;
    return closedChallenges;
  }, [tab, activeChallenges, incomingChallenges, closedChallenges]);

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

  const Tabs = useMemo(() => {
    return (
      <View style={styles.tabsWrap}>
        <View style={styles.tabsPill}>
          <Pressable
            onPress={() => setTab('active')}
            style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
              Aktiv
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('incoming')}
            style={[styles.tabBtn, tab === 'incoming' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'incoming' && styles.tabTextActive]}>
              Kommend 
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('closed')}
            style={[styles.tabBtn, tab === 'closed' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'closed' && styles.tabTextActive]}>
              Geschlossen
            </Text>
          </Pressable>
        </View>

        <Text style={styles.tabHint}>
          {tab === 'active' && 'Alle aktuell laufenden Challenges.'}
          {tab === 'incoming' && 'Alle Challenges, die bald starten.'}
          {tab === 'closed' && 'Alle geschlossenen Challenges.'}
        </Text>
      </View>
    );
  }, [tab, activeChallenges.length, incomingChallenges.length, closedChallenges.length]);

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.centered}>
        <View style={styles.hero}>
          <View style={styles.accentLine} />
          <Text style={styles.heroTitle}>Alle Challenges</Text>
          <Text style={styles.heroSub}>Beweg dich gemeinsam mit anderen.</Text>
          {Tabs}
        </View>
      </View>
    );
  }, [Tabs]);

  const Empty = useMemo(() => {
    const map = {
      active: ['Keine aktiven Challenges', 'Momentan sind keine aktiven Challenges verfügbar.'],
      incoming: ['Keine kommenden Challenges', 'Momentan sind keine kommenden Challenges verfügbar.'],
      closed: ['Keine geschlossenen Challenges', 'Momentan sind keine geschlossenen Challenges verfügbar.'],
    } as const;

    const [title, text] = map[tab];

    return (
      <View style={styles.centered}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptyText}>{text}</Text>
        </View>
      </View>
    );
  }, [tab]);

  const goToDetails = (id: string) => {
    router.push({ pathname: DETAILS_PATH, params: { id } });
  };

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
                onPress={() => goToDetails(String(item.id))}
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
    marginBottom: 14,
  },

  tabsWrap: { marginBottom: 0 },
  tabsPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,20,17,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
    borderRadius: 999,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...(shadow ?? {}),
  },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.sub },
  tabTextActive: { color: COLORS.text },
  tabHint: { marginTop: 8, fontSize: 13, color: COLORS.sub },

  cardSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...(shadow ?? {}),
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
