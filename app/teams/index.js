import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import TeamCard from '../../components/TeamCard';
import { deleteTeam, getTeams } from '../../services/teamService';

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('teams');

  // Gefilterte Teams basierend auf Suchanfrage
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return teams;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return teams.filter(team => 
      team.name?.toLowerCase().includes(query) ||
      team.id?.toString().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, teams]);

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
      console.error('Failed to load teams:', err);
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
      setSearchQuery('');
      loadTeams();
    }, [])
  );

  // Navigation Handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'ranking':
        router.push('/ranking');
        break;
      case 'challenges':
        router.push('/challenges');
        break;
      case 'teams':
        // Bleibt auf aktueller Seite
        break;
      case 'more':
        router.push('/more');
        break;
      default:
        break;
    }
  };

  if (loadingInitial && teams.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator style={styles.loader} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.container}>
        {/* Suchleiste */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Teams suchen..."
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

        {/* Such-Info */}
        {searchQuery.trim() && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>
              {filteredTeams.length} von {teams.length} Teams gefunden
              {searchQuery.trim() && ` für "${searchQuery}"`}
            </Text>
          </View>
        )}

        <Pressable onPress={() => router.push('/teams/create')} style={styles.createButton}>
          <Text style={styles.createButtonText}>Neues Team erstellen</Text>
        </Pressable>

        {loadingInitial && teams.length === 0 ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <FlatList
            data={filteredTeams}
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
            onEndReached={searchQuery.trim() ? null : loadTeams}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.trim() 
                    ? `Keine Teams gefunden für "${searchQuery}"`
                    : 'Keine Teams vorhanden'
                  }
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore && !searchQuery.trim() ? (
                <ActivityIndicator style={{ margin: 16 }} />
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
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
  // Suchleiste Styles
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
  // Such-Info Styles
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
  // Empty State
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
