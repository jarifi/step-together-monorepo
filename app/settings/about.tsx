import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Über die App</Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>Step Together</Text> ist eine moderne
          Schritt- und Challenge-Tracking-App, die Teams miteinander verbindet.
          Ziel ist es, Bewegung unterhaltsamer, motivierender und sozialer zu
          gestalten.
        </Text>

        <Text style={styles.text}>
          Nutzer können Teil eines Teams sein und gemeinsam an Challenges teilnehmen. 
          Dabei sehen sie auch andere teilnehmende Teams und deren aktuellen Fortschritt.
        </Text>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projektstatus</Text>
          <Text style={styles.text}>
            Die App befindet sich in aktiver Entwicklung. Neue Features,
            Fehlerbehebungen und Design-Verbesserungen kommen kontinuierlich
            dazu.
          </Text>
        </View>

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
    marginBottom: 16,
    textAlign: "center",
  },

  text: {
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
    lineHeight: 22,
  },

  bold: {
    fontWeight: "700",
  },

  section: {
    marginTop: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
  },

  listItem: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
    marginLeft: 6,
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
