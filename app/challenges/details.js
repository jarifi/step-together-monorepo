import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getChallengeById } from '../../services/challengeService';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await getChallengeById(id);
        console.log('Challenge details response:', JSON.stringify(data, null, 2));
        setChallenge(data);
      } catch (err) {
        console.error('Failed to load challenge details:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const teams = useMemo(() => {
    if (!challenge) return [];
    // HIER anpassen, wenn dein Backend anders heißt:
    // z.B. challenge.participatingTeams oder challenge.challengeTeams
    return challenge.teams || [];
  }, [challenge]);

  const leadingTeam = useMemo(() => {
    if (!teams.length) return null;
    return teams.reduce(
      (max, t) =>
        (t.totalSteps ?? 0) > (max?.totalSteps ?? 0) ? t : max,
      null
    );
  }, [teams]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Challenge not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Challenge Infos */}
      <Text style={styles.title}>{challenge.name}</Text>
      <Text style={styles.sub}>
        {challenge.startLocation} → {challenge.targetLocation}
      </Text>
      <Text style={styles.sub}>
        Distance: {challenge.distance} km | State: {challenge.state}
      </Text>

      {/* Leading Team */}
      {leadingTeam && (
        <View style={styles.leadingBox}>
          <Text style={styles.leadingTitle}>Leading team</Text>
          <Text style={styles.leadingName}>{leadingTeam.name}</Text>
          <Text style={styles.leadingSteps}>
            {leadingTeam.totalSteps} steps total
          </Text>
        </View>
      )}

      {/* Alle Teams */}
      <Text style={styles.sectionTitle}>Participating teams</Text>
      {teams.length === 0 ? (
        <Text style={styles.emptyText}>No teams in this challenge yet.</Text>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(t) => t.id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.teamRow}>
              <View>
                <Text style={styles.teamName}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.teamSteps}>
                  {item.totalSteps ?? 0} steps
                </Text>
              </View>
              {leadingTeam && leadingTeam.id === item.id && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Leader</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Zurück</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F4',
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  leadingBox: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E2F1E7',
  },
  leadingTitle: { fontSize: 14, color: '#555' },
  leadingName: { fontSize: 18, fontWeight: '700' },
  leadingSteps: { fontSize: 14, color: '#333' },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: { color: '#777' },
  teamRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: { fontSize: 15, fontWeight: '500' },
  teamSteps: { fontSize: 14, color: '#555' },
  badge: {
    backgroundColor: '#6B8F71',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  backButton: {
    marginTop: 20,
    backgroundColor: '#6B8F71',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#b91c1c',
    marginBottom: 12,
  },
});
