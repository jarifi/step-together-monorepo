import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import UserCard from '../../components/UserCard';
import { getUsers } from '../../services/userService';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  // Initial load on mount
  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
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
                },
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});
