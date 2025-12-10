import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChallengeCard from '../../components/ChallengeCard.js';
import { deleteChallenge, getChallenges } from '../../services/challengeService.js';

const { height: screenHeight } = Dimensions.get('window');

export default function ChallengesScreen() {
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
      setChallenges((prev) => [...prev, ...data]);
      setSkip((prev) => prev + data.length);

      if (data.length < limit) {
        setHasMore(false);
      }
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
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
      <View style={styles.container}>
        <FlatList
          data={visibleChallenges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() =>
                router.push({
                  pathname: '/challenges/details',
                  params: { id: item.id.toString() },
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
                    state: item.state,
                  },
                })
              }
              onDelete={async () => {
                try {
                  await deleteChallenge(item.id);
                  setChallenges((prev) =>
                    prev.filter((u) => u.id !== item.id)
                  );
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }}
            />
          )}
          onEndReached={loadChallenges}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Derzeit sind keine offenen oder kommenden Challenges vorhanden
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ margin: 16 }} />
            ) : null
          }
          contentContainerStyle={{
            flexGrow: 1,
            minHeight: screenHeight - 180,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
