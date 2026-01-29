import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BG = "#f7f9f5ff";
const EMAIL_SUPPORT = "support@StepTogether.com";

export default function Contact() {
  const openMail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const CopyBlock = ({
    icon,
    title,
    email,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    email: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={18} color="#111" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <TouchableOpacity
        onPress={() => openMail(email)}
        activeOpacity={0.85}
        style={styles.emailPill}
      >
        <Ionicons
          name={"send-outline" as keyof typeof Ionicons.glyphMap}
          size={16}
          color="#111"
        />
        <Text style={styles.emailText}>{email}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Tippe auf die Adresse, um dein Mail-Programm zu öffnen.
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* TOP ROW: back button left + icon centered */}
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

        <View style={styles.headerIcon}>
          <Ionicons
            name={"mail-outline" as keyof typeof Ionicons.glyphMap}
            size={22}
            color="#111"
          />
        </View>

        <View style={styles.rightSpacer} />
      </View>

      {/* Title + Subtitle */}
      <View style={styles.headerText}>
        <Text style={styles.title}>Kontakt</Text>
        <Text style={styles.subtitle}>
          Hast du Fragen oder Probleme? Schreib uns – wir helfen dir weiter.
        </Text>
      </View>

      {/* Support Email Card */}
      <CopyBlock
        icon={"headset-outline" as keyof typeof Ionicons.glyphMap}
        title="Support"
        email={EMAIL_SUPPORT}
      />

      {/* Extra Info Card (so it doesn't look empty) */}
      <View style={[styles.card, styles.infoCard]}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Ionicons
              name={"alert-circle-outline" as keyof typeof Ionicons.glyphMap}
              size={18}
              color="#111"
            />
          </View>
          <Text style={styles.cardTitle}>Hinweis für Anfragen</Text>
        </View>

        <Text style={styles.body}>
          Wenn du ein Problem meldest, schreib bitte kurz dazu:
        </Text>

        <View style={styles.bulletRow}>
          <Ionicons
            name={"chevron-forward" as keyof typeof Ionicons.glyphMap}
            size={14}
            color="#111"
          />
          <Text style={styles.bulletText}>
            Einen Betreff, z. B. <Text style={styles.bold}>"Schritte Einfügen – Fehler"</Text>
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons
            name={"chevron-forward" as keyof typeof Ionicons.glyphMap}
            size={14}
            color="#111"
          />
          <Text style={styles.bulletText}>
            Dein Betriebssystem und Version, z. B. <Text style={styles.bold}>iOS 26.2</Text> oder{" "}
            <Text style={styles.bold}>Android 15</Text>
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons
            name={"chevron-forward" as keyof typeof Ionicons.glyphMap}
            size={14}
            color="#111"
          />
          <Text style={styles.bulletText}>
            Deine <Text style={styles.bold}>User ID</Text> (zu finden unter{" "}
            <Text style={styles.bold}>Menü → Profil → „User ID“</Text>)
          </Text>
        </View>

        <Text style={styles.smallHint}>
          Damit können wir dein Problem deutlich schneller reproduzieren und lösen.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: BG },
  container: { padding: 16, paddingBottom: 40, backgroundColor: BG },

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
    fontSize: 28,
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
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  infoCard: {
    backgroundColor: "#ffffffff", // subtle warm tint so it feels “special”
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: "#c6d5caff",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },

  emailPill: {
    backgroundColor: "#c6d5caff",
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 5,
  },

  emailText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },

  hint: {
    marginTop: 10,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },

  body: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 10,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },

  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#111",
    lineHeight: 18,
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },

  smallHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
});
