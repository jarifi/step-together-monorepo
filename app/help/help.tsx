import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BG = "#f7f9f5ff";

export default function Help() {
  const Tip = ({
  icon,
  title,
  text,
  variant,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  variant?: "warning";
}) => (
  <View style={[styles.card, variant === "warning" && styles.warningCard]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.iconBadge, variant === "warning" && styles.warningIcon]}>
        <Ionicons name={icon} size={18} color="#111" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.body}>{text}</Text>
  </View>
);


  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* TOP ROW: back button left + REAL icon centered (same row) */}
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

        {/* REAL ICON (center) */}
        <View style={styles.headerIcon}>
          <Ionicons
            name={"sparkles-outline" as keyof typeof Ionicons.glyphMap}
            size={22}
            color="#111"
          />
        </View>

        {/* spacer keeps the center icon perfectly centered */}
        <View style={styles.rightSpacer} />
      </View>

      {/* Title + Subtitle */}
      <View style={styles.headerText}>
        <Text style={styles.title}>Hilfe</Text>
        <Text style={styles.subtitle}>
          Kleine Checkliste für die häufigsten Themen. Die meist Schnell lösbar sind.
        </Text>
      </View>

      <Tip
        icon={"trophy-outline" as keyof typeof Ionicons.glyphMap}
        title="Ziele setzen"
        text="Am Start (Dashboard) siehst du deine aktuelle Challenge. Dort kannst du deine Schritte für heute sowie für vergangene Tage eintragen. Du kannst deine Schritte entweder selbst mitzählen oder sie in der Health App (iOS) bzw. der Android-Gesundheitsapp nachsehen."
      />

      <Tip
        icon={"walk-outline" as keyof typeof Ionicons.glyphMap}
        title="Schritte werden nicht gespeichert"
        text="Wenn eingetragene Schritte nicht gespeichert werden, prüfe bitte, ob du auf „Bestätigen“ gedrückt hast und ob eine stabile Internetverbindung besteht."
      />

      <Tip
        icon={"people-outline" as keyof typeof Ionicons.glyphMap}
        title="Keine zugewiesene Challenge"
        text="Challenges werden dir von einem Admin zugewiesen. Falls du noch keine Challenge hast, wende dich bitte an den Support."
      />

      <Tip
        icon={"help-circle-outline" as keyof typeof Ionicons.glyphMap}
        title="Probleme gefunden?"
        text="Falls etwas nicht so funktioniert, wie es soll, kontaktiere bitte unseren Support über Hilfe & Support → Kontakt."
      />

      <Tip
        icon={"warning-outline" as keyof typeof Ionicons.glyphMap}
        title="Problem nicht aufgelistet?"
        text="Falls dein Problem hier nicht beschrieben ist, starte die App neu, prüfe deine Internetverbindung oder wende dich an den Support über Hilfe & Support → Kontakt."
        variant="warning"
/>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: BG },
  container: { padding: 16, paddingBottom: 40, backgroundColor: BG },

  // One row: left back button + centered icon
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

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    borderWidth: 1,
    borderColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "400",
    color: "#111",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  warningCard: {
    backgroundColor: "#fff7ed", // sehr helles Orange
    borderColor: "#facc15",
  },

  warningIcon: {
    backgroundColor: "#fde68a",
  },


  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 10,
  },

  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 17.5,
    fontWeight: "400",
    color: "#111",
  },

  body: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginTop: 10,
  },
});
