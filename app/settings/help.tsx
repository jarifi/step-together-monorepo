import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HelpScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Hilfe & Unterstützung</Text>

        {/* CONTACT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt</Text>
          <Text style={styles.text}>
            Wenn du Unterstützung benötigst oder einen Fehler melden möchtest,
            kannst du uns jederzeit kontaktieren:
          </Text>

          <Text style={styles.contact}>📧 support@step-together.app</Text>
          <Text style={styles.contact}>🌐 www.step-together.app/support</Text>
        </View>

        {/* PROBLEM SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Probleme melden</Text>
          <Text style={styles.text}>
            Falls die App sich ungewöhnlich verhält oder du einen Bug entdeckt
            hast, sende bitte eine kurze Beschreibung mit Screenshot an unseren
            Support.
          </Text>
        </View>

        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Zurück</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f7f2ff",
  },

  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 20,
    textAlign: "center",
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },

  question: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },

  answer: {
    fontSize: 15,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },

  text: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },

  contact: {
    fontSize: 15,
    color: "#2f5c3a",
    fontWeight: "600",
    marginTop: 4,
  },

  backButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#82ae8dff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
