import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import TeamCard from '../../components/TeamCard';
import { getTeams, deleteTeam } from '../../services/teamService';

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const loadTeams = async () => {
    if (loadingMore || !hasMore) return;

    const isInitial = teams.length === 0;
    if (isInitial) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const data = await getTeams(skip, limit);
      setTeams(prev => [...prev, ...data]);
      setSkip(prev => prev + data.length);

      if (data.length < limit) {
        setHasMore(false);
      }

    } catch (err) {
      console.error(('Failed to load teams:', err));
    } finally {
      if (isInitial) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setTeams([]);
      setHasMore(true);
      loadTeams();
    }, [])
  );

  if (loadingInitial) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/teams/create')} style={styles.createButton}>
        <Text style={styles.createButtonText}>Neues Team erstellen</Text>
      </Pressable>

      {loadingInitial && teams.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              onUpdate={() =>
                router.push({
                  pathname: '/teams/update',
                  params: {
                    id: item.id,
                    name: item.name,
                  },
                })
              }
              onDelete={async () => {
                try {
                  await deleteTeam(item.id);
                  setTeams((prev) => prev.filter((u) => u.id !== item.id));
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }}
            />
          )}
          onEndReached={loadTeams}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#6B8F71',
    padding: 12,
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