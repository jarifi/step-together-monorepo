import { ScrollView, StyleSheet } from 'react-native';

import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logoutBtn: { marginTop: 30 },
});



