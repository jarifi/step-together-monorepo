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

import ChallengeCard from '../../components/ChallengeCard';
import {
  deleteChallenge,
  getActiveParticipantsCounts,
  getChallengeInvites,
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

export default function AllChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredChallenges = useMemo(() => {
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
      const data = await getMyChallenges();
      const safe = Array.isArray(data) ? data : [];

      const count = await getActiveParticipantsCounts();
      const countMap = {};
      (Array.isArray(count) ? count : []).forEach((c) => {
        countMap[c.challenge_id] = c.active_participants;
      });

      const enriched = await Promise.all(
        safe.map(async (challenge) => {
          const base = { ...challenge, activeParticipants: countMap[challenge.id] ?? 0 };

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
              const invites = await getChallengeInvites(challenge.id);
              return { ...base, inviteCount: Array.isArray(invites) ? invites.length : 0 };
            } catch {
              return { ...base, inviteCount: 0 };
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>Meine Challenges</Text>

          {/* Search */}
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

          {/* Search Info */}
          {searchQuery.trim() ? (
            <View style={styles.searchInfoPill}>
              <Text style={styles.searchInfoText}>
                {filteredChallenges.length} von {challenges.length} gefunden · „
                {searchQuery.trim()}"
              </Text>
            </View>
          ) : null}

          {/* Create Challenge Button */}
          <Pressable
            onPress={() => router.push('/CreateHybridChallenge')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>+ Neue Challenge</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
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
                    pathname: '/hybridUpdate',
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

              {!searchQuery.trim() && (
                <Pressable
                  onPress={() => router.push('/CreateHybridChallenge')}
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

  cardWrap: {},
});
