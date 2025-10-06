import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import UserCard from '../../components/UserCard';
import { deleteUser, getUsers } from '../../services/userService';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

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
      loadUsers();
    }, [])
  );


  if (loadingInitial) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/users/create')} style={styles.createButton}>
        <Text style={styles.createButtonText}>Neue Benutzer erstellen</Text>
      </Pressable>

      {loadingInitial && users.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={users}
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
          onEndReached={loadUsers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
          style={styles.flatList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff', // Weißer Hintergrund für den Container
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Weißer Hintergrund für den Loader
  },
  flatList: {
    backgroundColor: '#ffffff', // Weißer Hintergrund für die FlatList
  },
  createButton: {
    backgroundColor: '#6B8F71',
    padding: 12,
    marginBottom: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});