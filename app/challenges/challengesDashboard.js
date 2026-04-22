import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import ChallengeCard from '../../components/ChallengeCard';
import { useUser } from '../../context/UserContext';
import { getActiveParticipantsCounts, getChallengeTeams, getChallenges } from '../../services/challengeService';

const { height: screenHeight } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 26;
const DETAILS_PATH = '/challenges/details';

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
};

export default function AllChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const { user } = useUser();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [tab, setTab] = useState('active');

  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredChallenges = useMemo(() => {
    if (!searchQuery.trim()) return challenges;

    const query = searchQuery.toLowerCase().trim();
    return challenges.filter((challenge) => {
      const name = challenge?.name?.toLowerCase?.() ?? '';
      const id = challenge?.id?.toString?.() ?? '';
      const start = challenge?.startLocation?.toLowerCase?.() ?? '';
      const target = challenge?.targetLocation?.toLowerCase?.() ?? '';
      const teamId = challenge?.teamId?.toString?.() ?? '';
      const teamCount = challenge?.teamCount?.toString?.() ?? '';

      return (
        name.includes(query) ||
        id.includes(query) ||
        start.includes(query) ||
        target.includes(query) ||
        teamId.includes(query) ||
        teamCount.includes(query)
      );
    });
  }, [searchQuery, challenges]);

  const openChallenges = useMemo(
    () =>
      filteredChallenges.filter(
        (challenge) => String(challenge?.state ?? '').toLowerCase() === 'open'
      ),
    [filteredChallenges]
  );

  const incomingChallenges = useMemo(
    () =>
      filteredChallenges.filter(
        (challenge) => String(challenge?.state ?? '').toLowerCase() === 'incoming'
      ),
    [filteredChallenges]
  );

  const closedChallenges = useMemo(
    () =>
      filteredChallenges.filter(
        (challenge) => String(challenge?.state ?? '').toLowerCase() === 'closed'
      ),
    [filteredChallenges]
  );

  const visibleChallenges = useMemo(
    () => {
      if (tab === 'active') return openChallenges;
      if (tab === 'incoming') return incomingChallenges;
      return closedChallenges;
    },
    [tab, openChallenges, incomingChallenges, closedChallenges]
  );

  useEffect(() => {
    if (user?.activeChallenges) {
      setChallenges(user.activeChallenges);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadChallenges = async () => {
        setLoadingInitial(true);

        try {
          if (Array.isArray(user?.activeChallenges) && user.activeChallenges.length > 0) {
            if (mounted) setChallenges(user.activeChallenges);
            return;
          }

          const data = await getChallenges(0, 50);
          if (!mounted) return;

          const safe = Array.isArray(data) ? data : [];

          // Get active participants count for individual challenges
          const count = await getActiveParticipantsCounts();

          const countMap = {};
          count.forEach((c) => {
            countMap[c.challenge_id] = c.active_participants;
          });

          // Get team counts for team/hybrid challenges
          const enrichedChallenges = await Promise.all(
            safe.map(async (challenge) => {
              try {
                const teams = await getChallengeTeams(challenge.id);
                return {
                  ...challenge,
                  activeParticipants: countMap[challenge.id] ?? 0,
                  teamCount: Array.isArray(teams) ? teams.length : 0,
                };
              } catch (err) {
                console.error(`Failed to load teams for challenge ${challenge.id}:`, err);
                return {
                  ...challenge,
                  activeParticipants: countMap[challenge.id] ?? 0,
                  teamCount: 0,
                };
              }
            })
          );

          setChallenges(enrichedChallenges);
        } catch (err) {
          console.error('Failed to load challenges dashboard list:', err);
          if (mounted) setChallenges([]);
        } finally {
          if (mounted) setLoadingInitial(false);
        }
      };

      loadChallenges();

      return () => {
        mounted = false;
      };
    }, [user?.activeChallenges])
  );

  if (loadingInitial) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Challenges...</Text>
      </View>
    );
  }

  const emptyMap = {
    active: ['Keine aktiven Challenges', 'Momentan sind keine aktiven Challenges verfügbar.'],
    incoming: ['Keine kommenden Challenges', 'Momentan sind keine kommenden Challenges verfügbar.'],
    closed: ['Keine geschlossenen Challenges', 'Momentan sind keine geschlossenen Challenges verfügbar.'],
  };

  const [emptyTitle, emptyText] = emptyMap[tab] ?? emptyMap.active;


  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Meine Challenges</Text>

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

          <View style={styles.searchWrap}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Challenges suchen…"
              placeholderTextColor="#8A9590"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={10}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>

          {searchQuery.trim() ? (
            <View style={styles.searchInfoPill}>
              <Text style={styles.searchInfoText}>
                {filteredChallenges.length} von {challenges.length} gefunden · „
                {searchQuery.trim()}“
              </Text>
            </View>
          ) : null}
        </View>

        <FlatList
          data={visibleChallenges}
          keyExtractor={(item) => String(item?.id)}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ChallengeCard
                challenge={item}
                showActions={false}
                actionIcon="check"
                onPress={() => {
                  const state = String(item?.state ?? '').toLowerCase();

                  if (state === 'incoming' || state === 'closed') {
                    router.push({
                      pathname: DETAILS_PATH,
                      params: { id: String(item.id) },
                    });
                    return;
                  }

                  const mode = String(item?.mode ?? '').toLowerCase();

                  if (mode === 'team' || mode === 'hybrid') {
                    router.push({
                      pathname: '/challenges/challengeTeamDashboard',
                      params: {
                        id: String(item.id),
                        name: item?.name ?? '',
                        startLocation: item?.startLocation ?? '',
                        targetLocation: item?.targetLocation ?? '',
                        distance: String(item?.distance ?? 0),
                        startDate: item?.startDate ?? '',
                        endDate: item?.endDate ?? '',
                        state: item?.state ?? '',
                      },
                    });
                    return;
                  }

                  if (mode === 'individual') {
                    router.push({
                      pathname: '/challenges/challengeIndividualDashboard',
                      params: {
                        id: String(item.id),
                        name: item?.name ?? '',
                        startLocation: item?.startLocation ?? '',
                        targetLocation: item?.targetLocation ?? '',
                        distance: String(item?.distance ?? 0),
                        startDate: item?.startDate ?? '',
                        endDate: item?.endDate ?? '',
                        state: item?.state ?? '',
                      },
                    });
                    return;
                  }

                  router.push('/myChallenge');
                }}
              />
            </View>
          )}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{searchQuery.trim() ? 'Keine Treffer' : emptyTitle}</Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `Für „${searchQuery.trim()}“ wurde nichts gefunden.`
                  : emptyText}
              </Text>

              {!searchQuery.trim() && (
                <Pressable
                  onPress={() => router.push('/challenges/create')}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryBtnText}>Challenge erstellen</Text>
                </Pressable>
              )}
            </View>
          }
          contentContainerStyle={{
            paddingBottom: 28,
            flexGrow: 1,
            minHeight: screenHeight - 220,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.sub,
  },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  tabsWrap: {
    marginTop: 12,
    marginBottom: 2,
  },
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
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.sub,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  tabHint: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.sub,
  },
  searchWrap: {
    marginTop: 14,
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFCFB',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 15,
    color: COLORS.text,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,20,17,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: COLORS.sub,
    fontSize: 14,
    fontWeight: '900',
    marginTop: -1,
  },

  searchInfoPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(85,128,92,0.18)',
  },
  searchInfoText: {
    fontSize: 12,
    color: COLORS.sub,
    fontWeight: '700',
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.sub,
    textAlign: 'center',
    maxWidth: 320,
  },

  cardWrap: {
    marginBottom: 0,
  },
});