import { View, Text, StyleSheet } from 'react-native';

export default function ChallengeBox({ challenge }: { challenge: any }) {
  const progress = (challenge.fortschrittKm / challenge.streckenlaenge) * 100;
console.log(challenge.fortschrittKm +"f");
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{challenge.name}</Text>
      <Text>{challenge.startOrt} → {challenge.zielOrt}</Text>
      <Text>{challenge.fortschrittKm} / {challenge.streckenlaenge} km</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFg, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
  },
  progressBarFg: {
    height: 10,
    backgroundColor: '#1b5e20',
    borderRadius: 5,
  },
});
