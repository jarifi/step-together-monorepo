import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function WeeklyStepsChart({ steps }: { steps: number[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wöchentliche Schritte</Text>
      <LineChart
        data={{
          labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
          datasets: [
            {
              data: steps,
            },
          ],
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#f0f0f0',
          backgroundGradientFrom: '#e8f5e9',
          backgroundGradientTo: '#e8f5e9',
          decimalPlaces: 0,
          color: (opacity =8) => `rgba(27, 94, 32, ${opacity})`,
          labelColor: () => '#333',
          style: {
            borderRadius: 16,
          },
        }}
        bezier
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 10,
  },
});
