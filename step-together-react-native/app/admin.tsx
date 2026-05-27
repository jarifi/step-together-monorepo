import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AdminScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >

      {/* Navigations-Card */}
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, styles.centerText]}>
          Verwaltung
        </Text>

        {/* Challenge erstellen */}
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/challenges/adminCreate')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons name="add-circle-outline" size={22} style={styles.navIcon} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Challenge erstellen</Text>
              <Text style={styles.navSubText}>
                Neue Challenge mit Individual- oder Gruppenmodus anlegen.
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            style={styles.chevron}
          />
        </Pressable>

        {/* Alle Challenges */}
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/challenges')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons name="flag" size={22} style={styles.navIcon} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Alle Challenges</Text>
              <Text style={styles.navSubText}>
                Bestehende und kommende Challenges verwalten.
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            style={styles.chevron}
          />
        </Pressable>

        {/* Alle Teams */}
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/teams')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons
                name="diversity-3"
                size={22}
                style={styles.navIcon}
              />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Alle Teams</Text>
              <Text style={styles.navSubText}>
                Teamstrukturen und Mitglieder im Überblick.
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            style={styles.chevron}
          />
        </Pressable>

        {/* Alle Benutzer */}
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/users')}
        >
          <View style={styles.navContent}>
            <View style={styles.navIconWrapper}>
              <MaterialIcons name="groups" size={22} style={styles.navIcon} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navText}>Alle Benutzer</Text>
              <Text style={styles.navSubText}>
                Alle Benutzerkonten verwalten.
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
    paddingBottom: 100,
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

  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#82ae8dff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
    textAlign: 'center',
  },

  sub: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 3,
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
