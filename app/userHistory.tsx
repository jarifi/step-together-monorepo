import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getChallengeHistory } from './../services/challengeService.js';

export default function ChallengeHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getChallengeHistory();
          setHistory(data ?? []);
        } catch (err) {
          console.error('Failed to load challenge history:', err);
          setHistory([]);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const hasHistory = history.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenge History</Text>
      <Text style={styles.sub}>
        Hier siehst du alle Challenges, an denen du bereits teilgenommen hast.
      </Text>

      {!hasHistory && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Noch keine Challenges</Text>
          <Text style={styles.emptyText}>
            Du hast bisher an keiner Challenge teilgenommen.
          </Text>
          <Pressable
            onPress={() => router.push('/challenges')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Zu den Challenges</Text>
          </Pressable>
        </View>
      )}

      {hasHistory && (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ gap: 10, paddingTop: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/allChallenges/details',
                  params: { id: item.id.toString() },
                })
              }
            >
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>

                <Text style={styles.cardLine}>
                  {item.startLocation} → {item.targetLocation}
                </Text>

                <Text style={styles.cardLine}>
                  Distanz: {item.distance} km
                </Text>

                <Text style={styles.cardSmall}>
                  Status: {item.state} | Beendet:{' '}
                  {item.endDate
                    ? new Date(item.endDate).toLocaleDateString()
                    : '-'}
                </Text>

                <Text style={styles.cardLink}>
                  Teams & Ranking anzeigen ›
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
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
    fontSize: 13,
    color: '#555',
    marginBottom: 16,
  },
  emptyBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#E8F0E6',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#6B8F71',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardLine: {
    fontSize: 13,
    color: '#444',
  },
  cardSmall: {
    fontSize: 11,
    color: '#777',
    marginTop: 6,
  },
  cardLink: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B8F71',
  },
});
