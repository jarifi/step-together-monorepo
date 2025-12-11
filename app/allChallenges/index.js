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
import { deleteChallenge, getChallenges } from '../../services/challengeService';

const { height: screenHeight } = Dimensions.get('window');

export default function AllChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredChallenges = useMemo(() => {
    if (!searchQuery.trim()) {
      return challenges;
    }

    const query = searchQuery.toLowerCase().trim();
    return challenges.filter((challenge) =>
      challenge.name?.toLowerCase().includes(query) ||
      challenge.id?.toString().includes(query) ||
      challenge.startLocation?.toLowerCase().includes(query) ||
      challenge.targetLocation?.toLowerCase().includes(query) ||
      challenge.state?.toLowerCase().includes(query) ||
      challenge.teamId?.toString().includes(query)
    );
  }, [searchQuery, challenges]);

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
      setSearchQuery('');
      loadChallenges();
    }, [])
  );

  if (loadingInitial && challenges.length === 0) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
      <View style={styles.container}>
        {/* Searchbar */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Challenges suchen..."
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Search Info */}
        {searchQuery.trim() && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>
              {filteredChallenges.length} von {challenges.length} Challenges gefunden
              {searchQuery.trim() && ` für "${searchQuery}"`}
            </Text>
          </View>
        )}

        {/* Create Challenge Button */}
        <Pressable
          onPress={() => router.push('/challenges/create')}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Neue Challenge erstellen</Text>
        </Pressable>

        {/* List */}
        <FlatList
          data={filteredChallenges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              showActions={true} 
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
                  setChallenges((prev) => prev.filter((u) => u.id !== item.id));
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }}
            />
          )}
          onEndReached={searchQuery.trim() ? null : loadChallenges}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `Keine Challenges gefunden für "${searchQuery}"`
                  : 'Keine Challenges vorhanden'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore && !searchQuery.trim() ? (
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    paddingRight: 45,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#ccc',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchInfo: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B8F71',
  },
  searchInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  createButton: {
    backgroundColor: '#6B8F71',
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
