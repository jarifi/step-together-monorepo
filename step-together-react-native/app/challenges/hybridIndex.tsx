import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChallengeCard from '../../components/ChallengeCard';
import { getUserRole } from '../../lib/auth';
import {
  deleteChallenge,
  getActiveParticipantsCounts,
  getChallengeParticipants,
  getChallengeTeams,
  getMyChallenges,
} from '../../services/challengeService';

const { height: screenHeight } = Dimensions.get('window');

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
};

interface Challenge {
  id: number | string;
  name?: string;
  startLocation?: string;
  targetLocation?: string;
  distance?: number;
  startDate?: string;
  endDate?: string;
  creatorId?: number | string;
  teamId?: number | string;
  mode?: string;
  activeParticipants?: number;
  teamCount?: number;
  participantCount?: number;
}

interface ParticipantCount {
  challenge_id: number | string;
  active_participants: number;
}

export default function AllChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filteredChallenges = useMemo<Challenge[]>(() => {
    if (!searchQuery.trim()) return challenges;

    const query = searchQuery.toLowerCase().trim();
    return challenges.filter((challenge) => {
      const name = challenge?.name?.toLowerCase?.() ?? '';
      const id = challenge?.id?.toString?.() ?? '';
      const start = (challenge?.startLocation ?? '').toLowerCase();
      const target = (challenge?.targetLocation ?? '').toLowerCase();

      return (
        name.includes(query) ||
        id.includes(query) ||
        start.includes(query) ||
        target.includes(query)
      );
    });
  }, [searchQuery, challenges]);

  const loadChallenges = async () => {
    setLoadingInitial(true);
    try {
      const role = await getUserRole();
      const data = await getMyChallenges();
      const all: Challenge[] = Array.isArray(data) ? data : [];
      const safe = role === 'admin' ? all.filter((c) => c.mode === 'individual') : all;

      const count = await getActiveParticipantsCounts();
      const countMap: Record<string | number, number> = {};
      (Array.isArray(count) ? count : []).forEach((c: ParticipantCount) => {
        countMap[c.challenge_id] = c.active_participants;
      });

      const enriched = await Promise.all(
        safe.map(async (challenge) => {
          const base: Challenge = { ...challenge, activeParticipants: countMap[challenge.id] ?? 0 };

          if (challenge.mode === 'team') {
            try {
              const teams = await getChallengeTeams(challenge.id);
              return { ...base, teamCount: Array.isArray(teams) ? teams.length : 0 };
            } catch {
              return { ...base, teamCount: 0 };
            }
          }

          if (challenge.mode === 'individual') {
            try {
              const participants = await getChallengeParticipants(challenge.id);
              return { ...base, participantCount: Array.isArray(participants) ? participants.length : 0 };
            } catch {
              return { ...base, participantCount: 0 };
            }
          }

          return base;
        })
      );

      setChallenges(enriched);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setChallenges([]);
      setSearchQuery('');
      loadChallenges();
    }, [])
  );

  if (loadingInitial && challenges.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Challenges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.tabBarWrap, { paddingTop: insets.top + 10 }]}>
        <View style={styles.tabBarRow}>
          <Pressable style={[styles.tabPill, styles.tabPillActive]}>
            <MaterialIcons name="list" size={18} color="#6B8F71" />
            <Text style={[styles.tabPillLabel, styles.tabPillLabelActive]}>Verwaltung</Text>
          </Pressable>
          <Pressable style={styles.tabPill} onPress={() => router.replace('/userHistory')}>
            <MaterialIcons name="history" size={18} color="#9CA3AF" />
            <Text style={styles.tabPillLabel}>Verlauf</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.accentLine} />
          <Text style={styles.title}>Challenge Verwaltung</Text>
          <Text style={styles.heroSub}>Verwalte deine Challenges und erstell neue.</Text>

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
                {searchQuery.trim()}"
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/challenges/hybridCreate')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>+ Neue Challenge</Text>
          </Pressable>
        </View>

        <FlatList<Challenge>
          data={filteredChallenges}
          keyExtractor={(item) => String(item?.id)}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ChallengeCard
                challenge={item}
                showActions={true}
                onPress={() =>
                  router.push({
                    pathname: '/challenges/details',
                    params: { id: String(item.id) },
                  })
                }
                onUpdate={() =>
                  router.push({
                    pathname: '/challenges/update',
                    params: {
                      id: item.id,
                      name: item.name,
                      startLocation: item.startLocation,
                      targetLocation: item.targetLocation,
                      distance: item.distance?.toString(),
                      startDate: item.startDate,
                      endDate: item.endDate,
                      creatorId: item.creatorId,
                      teamId: item.teamId,
                      mode: item.mode,
                    },
                  })
                }
                onDelete={async () => {
                  try {
                    await deleteChallenge(item.id);
                    setChallenges((prev) => prev.filter((u) => u.id !== item.id));
                  } catch (error) {
                    console.error('Delete failed:', error);
                  }
                }}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() ? 'Keine Treffer' : 'Keine Challenges'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `Für „${searchQuery.trim()}" wurde nichts gefunden.`
                  : 'Erstell deine erste Challenge und leg los.'}
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: 150,
            flexGrow: 1,
            minHeight: screenHeight - 180,
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
    paddingTop: 12,
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
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  accentLine: {
    width: 140,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 15,
    color: COLORS.sub,
    lineHeight: 21,
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

  tabBarWrap: {
    backgroundColor: '#F5F7F4',
    paddingHorizontal: 18,
    paddingBottom: 2,
  },
  tabBarRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: 'rgba(107,143,113,0.12)',
  },
  tabPillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabPillLabelActive: {
    color: '#6B8F71',
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

  cardWrap: {},
});
