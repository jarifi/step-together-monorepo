import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import TeamCard from '../../components/TeamCard';
import { getTeams } from '../../services/teamService';

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTeams = async () => {
    setLoading(true);
    const data = await getTeams();
    setTeams(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/teams/create')} style={styles.createButton}>
        <Text style={styles.createButtonText}>Neues Team erstellen</Text>
      </Pressable>
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