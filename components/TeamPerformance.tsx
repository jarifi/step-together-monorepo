import { View, Text, StyleSheet, FlatList } from 'react-native';

interface TeamMember {
  id: number;
  name: string;
  steps: number;
}

export default function TeamPerformance({ members }: { members: TeamMember[] }) {
  const totalSteps = members.reduce((sum, m) => sum + m.steps, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team-Leistung</Text>
      <Text style={styles.subtitle}>Diese Woche insgesamt {totalSteps.toLocaleString()} Schritte</Text>
      <FlatList
        horizontal
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.memberBox}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.steps}>{item.steps.toLocaleString()} Schritte</Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 30 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#1b5e20' },
  subtitle: { marginBottom: 10, color: '#555' },
  memberBox: { alignItems: 'center', marginRight: 20 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#a5d6a7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarText: { color: '#1b5e20', fontWeight: 'bold', fontSize: 20 },
  name: { fontWeight: '600' },
  steps: { color: '#777' },
});
