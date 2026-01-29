import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { router } from "expo-router";


type HelpCardProps = {
  title: string;
  description: string;
  path: string; // e.g. "/help" or "/help/help"
};

const HelpCard = ({ title, description, path }: HelpCardProps) => {
  const handlePress = () => {
    router.push(path);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={handlePress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

export default function Start() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = isTablet ? "48%" : "100%";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wie können wir helfen?</Text>
        <Text style={styles.subtitle}>
          Hilfe, Support und rechtliche Informationen zu Step Together Together
        </Text>
      </View>

      {/* Card Grid */}
      <View style={styles.grid}>
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard
            title="Hilfe"
            description="Anleitungen und Unterstützung zur App"
            path="/help/help"
          />
        </View>

        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard
            title="Kontakt"
            description="So erreichst du unser Support-Team"
            path="/help/contact"
          />
        </View>

        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard
            title="Über Step Together"
            description="Informationen zur App und ihrem Zweck"
            path="/help/about"
          />
        </View>

        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard
            title="Datenschutz"
            description="Welche Daten wir speichern und warum"
            path="/help/privacy"
          />
        </View>

        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <HelpCard
            title="AGB"
            description="Allgemeine Geschäftsbedingungen"
            path="/help/terms"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#f7f9f5ff", // fixes black background issue
  },

  container: {
    padding: 16,
    paddingBottom: 40,
    marginTop: 30,
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "400",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  cardWrapper: {
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    minHeight: 110,
    justifyContent: "center",
    borderWidth: 1.3,
    borderColor: '#d5dfd9ef',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "500",
    color: "#829a81ff",
    marginBottom: 6,
    textAlign: "center",
  },

  cardDescription: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    textAlign: "center",
  },
});
