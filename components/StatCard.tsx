import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ value, label }: { value: string, label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
});
