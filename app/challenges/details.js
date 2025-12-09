import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getChallengeById, getChallengeTeams } from '../../services/challengeService';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [challenge, setChallenge] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const challengeId = Array.isArray(id) ? id[0] : id;

        const [challengeData, teamsData] = await Promise.all([
          getChallengeById(challengeId),
          getChallengeTeams(challengeId),
        ]);

        console.log('Challenge details response:', JSON.stringify(challengeData, null, 2));
        console.log('Challenge teams response:', JSON.stringify(teamsData, null, 2));

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

  const leadingTeam = useMemo(() => {
    if (!teams.length) return null;
    return teams.reduce(
      (max, t) =>
        (t.totalSteps ?? 0) > (max?.totalSteps ?? 0) ? t : max,
      null,
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
  <ScrollView 
    style={styles.container}
    contentContainerStyle={{ paddingBottom: 40 }}
    showsVerticalScrollIndicator={false}
  >

    {/* Challenge Card */}
    <View style={[styles.card, styles.centered]}>
      <Text style={styles.title}>{challenge.name}</Text>
      <Text style={styles.sub}>
        {challenge.startLocation} → {challenge.targetLocation}
      </Text>
      <Text style={styles.sub}>
        Distance: {challenge.distance} km | State: {challenge.state}
      </Text>
    </View>

    {/* Leading Team */}
    {leadingTeam && (
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.sectionHeader}>Leading Team</Text>
        <Text style={styles.highlight}>{leadingTeam.name}</Text>
        <Text style={styles.subSmall}>
          {(leadingTeam.totalSteps ?? 0)} steps total
        </Text>
      </View>
    )}

    <Text style={[styles.sectionTitle, styles.centerText]}>
      Participating Teams
    </Text>

    {/* Make THIS card scrollable too if many teams */}
    <View style={styles.card}>
      {teams.length === 0 ? (
        <Text style={styles.emptyText}>No teams in this challenge yet.</Text>
      ) : (
        <View>
          {teams.map((item, index) => (
            <View style={styles.teamRow} key={item.id}>
              <View>
                <Text style={styles.teamName}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.teamSteps}>
                  {(item.totalSteps ?? 0)} steps
                </Text>
              </View>

              {leadingTeam?.id === item.id && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Leader</Text>
                </View>
              )}
            </View>
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

  centered: {
    alignItems: 'center',
  },

  centerText: {
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.07,      // softer
    shadowRadius: 18,         // bigger blur
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,             // Android softness
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
    marginBottom: 12,
    color: '#111',
    textAlign: 'center',
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
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
  },

  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },

  teamSteps: {
    fontSize: 14,
    color: '#666',
  },

  badge: {
    backgroundColor: '#82ae8dff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },

  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // 🍏 Softer floating button
  backButton: {
    marginTop: 10,
    backgroundColor: '#82ae8dff',
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

  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

