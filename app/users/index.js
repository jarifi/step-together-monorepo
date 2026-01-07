import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import UserCard from '../../components/UserCard';
import { deleteUser, getUsers, searchUsers } from '../../services/userService';

const { height: screenHeight } = Dimensions.get('window');

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }
    
    // If we have API search results, use those
    if (searchResults.length > 0) {
      return searchResults;
    }
    
    // Otherwise, filter locally loaded users
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id?.toString().includes(query)
    );
  }, [searchQuery, users, searchResults]);

  // Search with debounce and API fallback
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const query = searchQuery.trim();
    
    // If no search query, clear search results
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // First, check if we have local results
    const localResults = users.filter(user => 
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase()) ||
      user.id?.toString().includes(query)
    );

    // If we have local results, no need to search API
    if (localResults.length > 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // No local results - search API after debounce
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, users]);

  const loadUsers = async () => {
    if (loadingMore || !hasMore) return;

    const isInitial = users.length === 0;
    if (isInitial) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const data = await getUsers(skip, limit);
      setUsers(prev => [...prev, ...data]);
      setSkip(prev => prev + data.length);

      if (data.length < limit) {
        setHasMore(false);
      }

    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      if (isInitial) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setUsers([]);
      setHasMore(true);
      setSearchQuery('');
      setSearchResults([]);
      loadUsers();
    }, [])
  );

  if (loadingInitial && users.length === 0) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
      <View style={[styles.container]}>
        {/* Suchleiste */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Benutzer suchen..."
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
              {isSearching ? (
                'Suche in der Datenbank...'
              ) : (
                <>
                  {filteredUsers.length} {searchResults.length > 0 ? 'Ergebnis(se) aus Datenbank' : `von ${users.length} Benutzern`} gefunden
                  {searchQuery.trim() && ` für "${searchQuery}"`}
                </>
              )}
            </Text>
          </View>
        )}

        <Pressable onPress={() => router.push('/users/create')} style={styles.createButton}>
          <Text style={styles.createButtonText}>Neue Benutzer erstellen</Text>
        </Pressable>

        {loadingInitial && users.length === 0 ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <UserCard
                user={item}
                onUpdate={() =>
                  router.push({
                    pathname: '/users/update',
                    params: {
                      id: item.id,
                      name: item.name,
                      email: item.email,
                      stepLength: item.stepLength,
                    },
                  })
                }
                onDelete={async () => {
                  try {
                    await deleteUser(item.id);
                    setUsers((prev) => prev.filter((u) => u.id !== item.id));
                  } catch (error) {
                    console.error('Delete failed:', error);
                  }
                }}
              />
            )}
            onEndReached={searchQuery.trim() ? null : loadUsers}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.trim() 
                    ? `Keine Benutzer gefunden für "${searchQuery}"`
                    : 'Keine Benutzer vorhanden'
                  }
                </Text>
              </View>
            }
            ListFooterComponent={
              (loadingMore && !searchQuery.trim()) || isSearching ? (
                <ActivityIndicator style={{ margin: 16 }} />
              ) : null
            }
            contentContainerStyle={{ flexGrow: 1, minHeight: screenHeight - 180 }}
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