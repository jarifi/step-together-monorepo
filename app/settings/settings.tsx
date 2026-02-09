import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Settings-Card */}
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, styles.centerText]}>
          Einstellungen
        </Text>

        {/* Mein Konto */}
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/settings/profile')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons name="person" size={22} style={styles.navIcon} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Mein Konto</Text>
              <Text style={styles.navSubText}>
                Profil & persönliche Daten
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            style={styles.chevron}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/settings/password')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons name="lock" size={22} style={styles.navIcon} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Passwort ändern</Text>
              <Text style={styles.navSubText}>
                Passwort & Sicherheit
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            style={styles.chevron}
          />
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f7f2ff',
  },

  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  centered: {
    alignItems: 'center',
  },

  centerText: {
    textAlign: 'center',
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
    textAlign: 'center',
  },

  navRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 10,
    backgroundColor: '#f9faf9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  navRowPressed: {
    backgroundColor: '#eef5ee',
  },

  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  navIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#e3efe6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  navIcon: {
    color: '#2f5c3a',
  },

  navTextContainer: {
    flex: 1,
  },

  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },

  navSubText: {
    fontSize: 13,
    color: '#666',
  },

  chevron: {
    color: '#999',
    marginLeft: 8,
  },
});
