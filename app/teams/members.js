import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getTeamMembers } from '../../services/teamService';

export default function TeamMembersScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const teamId = Array.isArray(id) ? id[0] : id;
        const data = await getTeamMembers(teamId);
        setMembers(data ?? []);
      } catch (error) {
        console.error('Fehler beim Laden der Teammitglieder:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header-Card */}
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.title}>{name ?? 'Team'}</Text>
        <Text style={styles.sub}>Teammitglieder</Text>
      </View>

      {/* Mitgliederliste */}
      <View style={styles.card}>
        {members.length === 0 ? (
          <Text style={styles.emptyText}>Dieses Team hat noch keine Mitglieder.</Text>
        ) : (
          members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name="person" size={22} color="#2f5c3a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>
                  {m.name ?? `User #${m.userId}`}
                </Text>
                {m.joiningDate && (
                  <Text style={styles.memberSub}>
                    Mitglied seit{' '}
                    {new Date(m.joiningDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Zurück</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f7f2ff',
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  emptyText: {
    color: '#777',
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 15,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3efe6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  memberSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  backButton: {
    marginTop: 10,
    backgroundColor: '#82ae8dff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
