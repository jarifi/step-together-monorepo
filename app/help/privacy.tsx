import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const BG = "#f7f9f5ff";


export default function Privacy() {
  const Section = ({
    icon,
    title,
    text,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    text: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={18} color="#111" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.body}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
  {/* TOP ROW: back button + existing icon */}
  <View style={styles.headerTopRow}>
    <TouchableOpacity
      style={styles.backButton}
      activeOpacity={0.7}
      onPress={() => router.back()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={"arrow-back" as keyof typeof Ionicons.glyphMap}
        size={20}
        color="#111"
      />
    </TouchableOpacity>

    {/* EXISTING icon (shield) */}
    <View style={styles.headerIcon}>
      <Ionicons
        name={"shield-checkmark-outline" as keyof typeof Ionicons.glyphMap}
        size={22}
        color="#111"
      />
    </View>

    {/* spacer to keep icon centered */}
    <View style={styles.rightSpacer} />
  </View>

  {/* Title + Subtitle */}
  <View style={styles.headerText}>
    <Text style={styles.title}>Datenschutz</Text>
    <Text style={styles.subtitle}>
      Was wir verarbeiten, warum und was wir bewusst nicht tun.
    </Text>
  </View>


      <Section
        icon={"help" as keyof typeof Ionicons.glyphMap}
        title="Welche Daten?"
        text={
          "Je nach Feature verarbeitet Step Together z. B. Schritte/Aktivität, App-Einstellungen und ggf. Kontodaten, " +
          "wenn du ein Profil nutzt. Wir versuchen Datensparsamkeit als Standard zu halten."
        }
      />

      <Section
        icon={"construct-outline" as keyof typeof Ionicons.glyphMap}
        title="Wofür nutzen wir sie?"
        text={
          "Damit du Statistiken siehst, Ziele tracken kannst und die App stabil läuft. " +
          "Wir nutzen Daten außerdem, um Fehler zu finden und die Benutzererfahrung zu verbessern."
        }
      />

      <Section
        icon={"eye-off-outline" as keyof typeof Ionicons.glyphMap}
        title="Was wir NICHT machen"
        text={
          "Kein Verkauf deiner Daten. Keine unnötige Weitergabe an Dritte. " +
          "Keine 'wir sammeln mal alles, vielleicht brauchen wir’s später'-Mentalität."
        }
      />

      <Section
        icon={"lock-closed-outline" as keyof typeof Ionicons.glyphMap}
        title="Sicherheit"
        text={
          "Wir setzen geeignete technische Maßnahmen ein (z. B. Zugriffskontrolle, sichere Übertragung, " +
          "Minimierung von gespeicherten Daten)."
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: BG },
  container: { padding: 16, paddingBottom: 40, backgroundColor: BG },

  header: { alignItems: "center", paddingTop: 40, paddingBottom: 18 },


  headerTopRow: {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 30,
  marginBottom: 12,
},

backButton: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  alignItems: "center",
  justifyContent: "center",
},

rightSpacer: {
  width: 40,
  height: 40,
},

headerText: {
  alignItems: "center",
  marginBottom: 18,
},


  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    borderWidth: 1,
    borderColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },


  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "400",
    
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "500",  color: "#111" },
  body: { fontSize: 14,  color: "#374151", lineHeight: 20 },

  note: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    gap: 10,
  },
  noteText: { flex: 1, fontSize: 13,  color: "#6B7280", lineHeight: 18 },
});
