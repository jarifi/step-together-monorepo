import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HelpCardProps = {
  title: string;
  description: string;
  path: string;
};

const HelpCard = ({ title, description, path }: HelpCardProps) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(path)}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

export default function Start() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const cardWidth = isTablet ? '48%' : '100%';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color="#5A7D60" />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Wie können wir helfen?</Text>
        <Text style={styles.subtitle}>
          Hilfe, Support und rechtliche Informationen zu Step Together
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard title="Hilfe" description="Anleitungen und Unterstützung zur App" path="/help/help" />
        </View>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard title="Kontakt" description="So erreichst du unser Support-Team" path="/help/contact" />
        </View>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard title="Über Step Together" description="Informationen zur App und ihrem Zweck" path="/help/about" />
        </View>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard title="Datenschutz" description="Welche Daten wir speichern und warum" path="/help/privacy" />
        </View>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard title="AGB" description="Allgemeine Geschäftsbedingungen" path="/help/terms" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#f7f9f5ff' },
  container: { padding: 16, paddingBottom: 100 },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(107,143,113,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '400', color: '#111', textAlign: 'center', marginBottom: 10, marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 320, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { marginBottom: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    minHeight: 110,
    justifyContent: 'center',
    borderWidth: 1.3,
    borderColor: '#d5dfd9ef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: { fontSize: 24, fontWeight: '500', color: '#829a81ff', marginBottom: 6, textAlign: 'center' },
  cardDescription: { fontSize: 13, color: '#555', lineHeight: 18, textAlign: 'center' },
});
