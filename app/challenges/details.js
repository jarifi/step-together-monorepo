import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getChallengeById, getChallengeTeams } from '../../services/challengeService';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [challenge, setChallenge] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setChallenge(null);
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const load = async () => {
      try {
        const challengeId = Array.isArray(id) ? id[0] : id;

        const [challengeData, teamsData] = await Promise.all([
          getChallengeById(challengeId),
          getChallengeTeams(challengeId),
        ]);

        setChallenge(challengeData);
        setTeams(teamsData ?? []);
      } catch (err) {
        console.error('Failed to load challenge details or teams:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const sortedTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    return [...teams].sort((a, b) => {
      const stepsA = a.totalSteps ?? 0;
      const stepsB = b.totalSteps ?? 0;

      if (stepsB !== stepsA) return stepsB - stepsA;

      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [teams]);

  // --- FIX: Normalize state to avoid showing "Führendes Team" before start ---
  const state = String(challenge?.state ?? '').trim().toLowerCase();

  // adjust these arrays if your backend uses other values
  const isUpcoming = ['upcoming', 'not_started', 'scheduled', 'future'].includes(state);
  const isClosed = ['closed', 'finished', 'ended'].includes(state);
  const isRunning = ['open', 'running', 'active'].includes(state);

  const leadingTeam = sortedTeams[0] ?? null;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>
        </View>

        <Text style={styles.errorText}>Challenge wurde nicht gefunden.</Text>
      </View>
    );
  }

  const stepsToKm = (steps) => {
    return (steps * 0.0008); // 1 Schritt = ca. 0.0008 km
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </Pressable>
      </View>

      {/* MAIN CARD */}
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.title}>{challenge.name}</Text>
        <Text style={styles.sub}>
          Distanz: {challenge.distance} km | Status: {challenge.state}
        </Text>
      </View>

      {/* LEADING / WINNER CARD */}
      {isRunning && leadingTeam && (
        <View style={[styles.card, styles.centered]}>
          <Text style={styles.sectionHeader}>Führendes Team</Text>

          <Text style={styles.highlight}>{leadingTeam.name}</Text>

          <Text style={styles.subSmall}>
            {(leadingTeam.totalSteps ?? 0).toLocaleString()} Schritte gesamt
          </Text>
          <Text style={styles.subSmall}>
            {stepsToKm(leadingTeam.totalSteps ?? 0)} km gesamt
          </Text>
        </View>
      )}

      {isClosed && leadingTeam && (
        <View style={[styles.card, styles.centered]}>
          <Text style={styles.sectionHeader}>Gewinner-Team</Text>

          <Text style={styles.highlight}>{leadingTeam.name}</Text>

          <Text style={styles.subSmall}>
            {(leadingTeam.totalSteps ?? 0).toLocaleString()} Schritte gesamt
          </Text>
          <Text style={styles.subSmall}>
            {stepsToKm(leadingTeam.totalSteps ?? 0)} km gesamt
          </Text>
        </View>
      )}

      {/* Optional hint for upcoming */}
      {isUpcoming && (
        <View style={[styles.card, styles.centered]}>
          <Text style={styles.sectionHeader}>Noch nicht gestartet</Text>
          <Text style={styles.subSmall}>
            Das führende Team wird erst angezeigt, sobald die Challenge gestartet ist.
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.centerText]}>
        Teilnehmende Teams
      </Text>

      <Text style={styles.tapHint}>
        Tippe ein Team an, um Details & Mitglieder zu sehen.
        {"\n"}
        Teams mit einem grünen Häkchen neben ihrem Namen haben die Challenge abgeschlossen.
      </Text>

      <View style={styles.card}>
        {sortedTeams.length === 0 ? (
          <Text style={styles.emptyText}>
            Es nehmen aktuell noch keine Teams teil.
          </Text>
        ) : (
          sortedTeams.map((item, index) => {
            const teamKm = stepsToKm(item.totalSteps ?? 0);
            const hasFinished = teamKm >= (challenge.distance ?? 0);

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.teamRow,
                  pressed && styles.rowPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/teams/members',
                    params: {
                      id: item.id.toString(),
                      name: item.name,
                      totalSteps: (item.totalSteps ?? 0).toString(),
                    },
                  })
                }
              >
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.teamName}>
                      {index + 1}. {item.name}
                    </Text>
                    {hasFinished && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="green"
                        style={{ marginLeft: 10 }}
                      />
                    )}
                  </View>
                  <Text style={styles.teamSteps}>
                    {(item.totalSteps ?? 0).toLocaleString()} Schritte · {teamKm.toFixed(2)} km
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f7f2',
    padding: 20,
  },

  header: {
    marginBottom: 20,
    marginTop: 40,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  pressed: {
    opacity: 0.7,
  },

  centered: { alignItems: 'center' },
  centerText: { textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
    marginBottom: 20,
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
    textAlign: 'center',
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },

  tapHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },

  sub: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },

  subSmall: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },

  highlight: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  emptyText: {
    color: '#777',
    paddingVertical: 16,
    textAlign: 'center',
  },

  teamRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
  },

  rowPressed: {
    backgroundColor: '#f0f6f0',
  },

  teamName: { fontSize: 16, fontWeight: '500', color: '#111' },
  teamSteps: { fontSize: 14, color: '#666' },

  errorText: {
    fontSize: 16,
    color: '#c00',
    textAlign: 'center',
    marginTop: 40,
  },
});
