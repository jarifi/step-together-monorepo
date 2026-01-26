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

      const nameA = (a.name ?? '').toLowerCase();
      const nameB = (b.name ?? '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [teams]);

  const isUpcoming = challenge?.state === 'upcoming';
  const isClosed = challenge?.state === 'closed';

  const leadingTeam = sortedTeams[0] ?? null;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Challenge wurde nicht gefunden.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.title}>{challenge.name}</Text>
        <Text style={styles.sub}>
          Distanz: {challenge.distance} km | Status: {challenge.state}
        </Text>
      </View>

      {!isUpcoming && leadingTeam && (
        <View style={[styles.card, styles.centered]}>
          <Text style={styles.sectionHeader}>
            {isClosed ? 'Gewinner-Team' : 'Führendes Team'}
          </Text>

          <Text style={styles.highlight}>{leadingTeam.name}</Text>

          <Text style={styles.subSmall}>
            {(leadingTeam.totalSteps ?? 0).toLocaleString()} Schritte gesamt
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.centerText]}>Teilnehmende Teams</Text>

      <Text style={styles.tapHint}>Tippe ein Team an, um Details & Mitglieder zu sehen.</Text>

      <View style={styles.card}>
        {sortedTeams.length === 0 ? (
          <Text style={styles.emptyText}>Es nehmen aktuell noch keine Teams teil.</Text>
        ) : (
          <View>
            {sortedTeams.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.teamRow,
                  pressed && { backgroundColor: '#f3f7f3' },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/teams/members',
                    params: {
                      id: item.id.toString(),
                      name: item.name,
                    },
                  })
                }
              >
                <View>
                  <Text style={styles.teamName}>
                    {index + 1}. {item.name}
                  </Text>
                  <Text style={styles.teamSteps}>
                    {(item.totalSteps ?? 0).toLocaleString()} Schritte
                  </Text>
                </View>

                <View style={styles.detailBox}>
                  <Text style={styles.detailBoxText}>Team Info</Text>
                  <Text style={styles.teamArrow}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Zurück</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f7f2ff',
    padding: 20,
    paddingTop: 60,
  },

  centered: { alignItems: 'center' },
  centerText: { textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 20,
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
    color: '#111',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
    textAlign: 'center',
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
    marginBottom: 3,
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
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
  },

  emptyText: {
    color: '#777',
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 15,
  },

  teamRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    borderRadius: 8,
  },

  teamName: { fontSize: 16, fontWeight: '500', color: '#111' },
  teamSteps: { fontSize: 14, color: '#666' },

  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9efe9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  detailBoxText: { fontSize: 13, color: '#444', marginRight: 4 },

  teamArrow: { fontSize: 20, fontWeight: '600', color: '#666' },

  backButton: {
    marginTop: 10,
    backgroundColor: '#82ae8d',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  errorText: {
    fontSize: 16,
    color: '#c00',
    textAlign: 'center',
    marginBottom: 16,
  },
});
