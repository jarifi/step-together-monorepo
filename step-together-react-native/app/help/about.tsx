import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BG = "#f7f9f5ff";
const FONT = Platform.OS === "ios" ? "System" : "Roboto";

export default function About() {
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

    {/* EXISTING icon, unchanged */}
    <View style={styles.headerIcon}>
      <Ionicons
        name={"information-circle-outline" as keyof typeof Ionicons.glyphMap}
        size={22}
        color="#111"
      />
    </View>

    {/* spacer to keep icon centered */}
    <View style={styles.rightSpacer} />
  </View>

  {/* Title + Subtitle */}
  <View style={styles.headerText}>
    <Text style={styles.title}>Über Step Together</Text>
    <Text style={styles.subtitle}>
      Step Together ist ein minimalistischer Schritt- und Aktivitätsbegleiter. Klar und schnell.
    </Text>
  </View>


      <Section
        icon={"walk-outline" as keyof typeof Ionicons.glyphMap}
        title="Was Step Together macht"
        text={
          "Step Together hilft dir, Bewegung im Alltag sichtbar zu machen: Schritte, Ziele und Fortschritt auf einen Blick. " +
          "Die App ist dafür gebaut, motivierend zu sein – ohne dich mit Menüs oder Werbung zu überladen."
        }
      />

      <Section
        icon={"trophy-outline" as keyof typeof Ionicons.glyphMap}
        title="Ziele & Motivation"
        text={
          "Du kannst dir erreichbare Ziele setzen und deinen Fortschritt verfolgen. " +
          "Kleine Routine > perfekte Performance. Step Together soll dich unterstützen, nicht stressen."
        }
      />

      <Section
        icon={"lock-closed-outline" as keyof typeof Ionicons.glyphMap}
        title="Datenschutz als Default"
        text={
          "Wir versuchen nur das zu verarbeiten, was für die Funktionen nötig ist. " +
          "Du findest die Details transparent im Datenschutz-Bereich."
        }
      />

      <Section
        icon={"medical-outline" as keyof typeof Ionicons.glyphMap}
        title="Wichtig"
        text={
          "Step Together ist keine medizinische App und ersetzt keine Beratung. " +
          "Wenn du gesundheitliche Fragen hast, hol dir professionelle Unterstützung."
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: BG },
  container: { padding: 16, paddingBottom: 100, backgroundColor: BG },

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
    marginBottom: 12,
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    marginBottom: 12,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "500",  color: "#111" },

  body: { fontSize: 14,  color: "#374151", lineHeight: 20, marginTop: 10, },
});
