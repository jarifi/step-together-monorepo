import { View, Text, StyleSheet } from 'react-native';

export default function WelcomeCard({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Willkommen zurück, {name}!</Text>
   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  subtext: {
    fontSize: 16,
    color: '#4caf50',
    marginTop: 4,
  },
});
