import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import UserCard from '../../components/UserCard';
import { deleteUser, getUsers } from '../../services/userService';

const { height: screenHeight } = Dimensions.get('window');

// Bottom Navigation Component
const BottomNavigation = ({ activeTab, onTabChange }) => {
  return (
    <View style={bottomNavStyles.container}>
      <TouchableOpacity style={bottomNavStyles.tab} onPress={() => onTabChange('dashboard')}>
        <Ionicons
          name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'dashboard' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[bottomNavStyles.tabText, { color: activeTab === 'dashboard' ? '#7FA58C' : '#6B7280' }]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={bottomNavStyles.tab} onPress={() => onTabChange('ranking')}>
        <Ionicons
          name={activeTab === 'ranking' ? 'trophy' : 'trophy-outline'}
          size={22}
          color={activeTab === 'ranking' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[bottomNavStyles.tabText, { color: activeTab === 'ranking' ? '#7FA58C' : '#6B7280' }]}>
          Ranking
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={bottomNavStyles.tab} onPress={() => onTabChange('challenges')}>
        <Ionicons
          name={activeTab === 'challenges' ? 'flag' : 'flag-outline'}
          size={22}
          color={activeTab === 'challenges' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[bottomNavStyles.tabText, { color: activeTab === 'challenges' ? '#7FA58C' : '#6B7280' }]}>
          Challenges
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={bottomNavStyles.tab} onPress={() => onTabChange('teams')}>
        <Ionicons
          name={activeTab === 'teams' ? 'people' : 'people-outline'}
          size={22}
          color={activeTab === 'teams' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[bottomNavStyles.tabText, { color: activeTab === 'teams' ? '#7FA58C' : '#6B7280' }]}>
          Teams
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={bottomNavStyles.tab} onPress={() => onTabChange('more')}>
        <Ionicons
          name={activeTab === 'more' ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
          size={22}
          color={activeTab === 'more' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[bottomNavStyles.tabText, { color: activeTab === 'more' ? '#7FA58C' : '#6B7280' }]}>
          Mehr
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const bottomNavStyles = {
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
};

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Bottom Navigation State
  const [activeTab, setActiveTab] = useState('more');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'more') {
      switch (tab) {
        case 'dashboard':
          router.push('/dashboard');
          break;
        case 'ranking':
          router.push('/dashboard');
          break;
        case 'challenges':
          router.push('/challenges');
          break;
        case 'teams':
          router.push('/teams');
          break;
        default:
          break;
      }
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id?.toString().includes(query)
    );
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
      loadUsers();
    }, [])
  );

  if (loadingInitial && users.length === 0) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
      <View style={[styles.container, { paddingBottom: 80 }]}>
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
              {filteredUsers.length} von {users.length} Benutzern gefunden
              {searchQuery.trim() && ` für "${searchQuery}"`}
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
              loadingMore && !searchQuery.trim() ? (
                <ActivityIndicator style={{ margin: 16 }} />
              ) : null
            }
            contentContainerStyle={{ flexGrow: 1, minHeight: screenHeight - 180 }}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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