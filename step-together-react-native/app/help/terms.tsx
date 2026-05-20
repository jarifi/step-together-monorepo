import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BG = "#f7f9f5ff";

export default function Terms() {
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
            name={"book" as keyof typeof Ionicons.glyphMap}
            size={22}
            color="#111"
          />
        </View>

        <View style={styles.rightSpacer} />
      </View>

      {/* Title + Subtitle */}
      <View style={styles.headerText}>
        <Text style={styles.title}>AGB</Text>
        <Text style={styles.subtitle}>Allgemeine Geschäftsbedingungen</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Anbieter und Geltungsbereich</Text>
        <Text style={styles.body}>
          Diese Allgemeinen Geschäftsbedingungen („AGB“) regeln die Nutzung der mobilen Anwendung
          „Step Together“ („App“) sowie damit verbundener Dienste. 
          {"\n\n"}
          Mit Registrierung, Zugriff oder Nutzung der App erklärst du dich mit diesen AGB einverstanden.
          Abweichende Bedingungen finden keine Anwendung, sofern nicht ausdrücklich schriftlich vereinbart.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Leistungsbeschreibung</Text>
        <Text style={styles.body}>
          Step Together ist ein Fitness-/Lifestyle-Dienst zur Darstellung und Auswertung von Aktivitäts-
          und Schrittinformationen sowie zur Zielverfolgung. Die App bietet keine medizinische Beratung
          und ersetzt keine ärztliche Diagnose oder Behandlung.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Registrierung und Nutzerkonto</Text>
        <Text style={styles.body}>
          Für bestimmte Funktionen ist die Erstellung eines Nutzerkontos erforderlich. Du verpflichtest dich,
          bei der Registrierung richtige und vollständige Angaben zu machen und diese aktuell zu halten.
          Der Zugang zum Konto ist durch deine Zugangsdaten (z. B. E-Mail und Passwort) zu sichern.
          Du bist für alle Aktivitäten verantwortlich, die über dein Konto erfolgen.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Nutzungsrechte und Pflichten</Text>
        <Text style={styles.body}>
          Du darfst die App nur im Rahmen der vorgesehenen Funktionen nutzen. Unzulässig sind insbesondere:{"\n"}
          • missbräuchliche oder rechtswidrige Nutzung{"\n"}
          • Störung oder Überlastung der App/Server{"\n"}
          • Umgehung von Sicherheitsmechanismen{"\n"}
          • automatisiertes Auslesen/Reverse Engineering, soweit gesetzlich nicht zwingend erlaubt{"\n\n"}
          Der Anbieter kann bei Verstößen Inhalte sperren, Funktionen einschränken oder Konten vorübergehend
          bzw. dauerhaft deaktivieren.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Verfügbarkeit, Änderungen und Updates</Text>
        <Text style={styles.body}>
          Es besteht kein Anspruch auf eine jederzeitige, unterbrechungsfreie Verfügbarkeit. Wartungen,
          Updates, technische Störungen oder externe Einflüsse können zu Einschränkungen führen.
          Der Anbieter ist berechtigt, Funktionen zu ändern, weiterzuentwickeln oder einzustellen,
          soweit dies zumutbar ist und wesentliche Pflichten nicht unzumutbar beeinträchtigt werden.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Entgelt / Kosten</Text>
        <Text style={styles.body}>
          Die Nutzung der App ist derzeit kostenlos, sofern in der App oder im jeweiligen Store nicht
          ausdrücklich etwas anderes angegeben ist. Kosten für Internetzugang oder Mobilfunkverbindung
          trägt der Nutzer.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Datenschutz</Text>
        <Text style={styles.body}>
          Informationen zur Verarbeitung personenbezogener Daten findest du in der Datenschutzerklärung.
          Im Rahmen der Nutzung können u. a. folgende Daten verarbeitet werden, soweit für die
          Vertragserfüllung und Bereitstellung der Funktionen erforderlich:{"\n\n"}
          • Kontodaten: E-Mail-Adresse, Passwort (gesichert/verschlüsselt gespeichert){"\n"}
          • Profildaten: Vorname, Nachname{"\n"}
          • Nutzungs-/Einstellungsdaten: z. B. Schrittlänge, Ziele, App-Einstellungen{"\n"}
          • Aktivitätsdaten: z. B. Schritt-/Aktivitätswerte{"\n\n"}
          Maßgeblich sind die Details in der Datenschutzerklärung (Zwecke, Rechtsgrundlagen, Speicherdauer,
          Empfänger, Betroffenenrechte).
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Geistiges Eigentum</Text>
        <Text style={styles.body}>
          Die App, Inhalte, Designs, Marken und Softwarebestandteile sind urheber- und/oder markenrechtlich
          geschützt. Dir wird ein einfaches, nicht übertragbares, widerrufliches Nutzungsrecht zur
          bestimmungsgemäßen Verwendung der App eingeräumt.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>9. Haftung</Text>
        <Text style={styles.body}>
          Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von
          Leben, Körper oder Gesundheit. Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
          wesentlicher Vertragspflichten („Kardinalpflichten“) und beschränkt auf den vorhersehbaren,
          typischerweise eintretenden Schaden. Eine Haftung für entgangenen Gewinn, Datenverlust oder
          Folgeschäden ist im gesetzlich zulässigen Umfang ausgeschlossen.{"\n\n"}
          Step Together liefert keine medizinischen Empfehlungen. Entscheidungen, die du auf Grundlage
          der App triffst, erfolgen in eigener Verantwortung.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>10. Kündigung / Beendigung</Text>
        <Text style={styles.body}>
          Du kannst die Nutzung der App jederzeit beenden und – sofern vorgesehen – dein Konto löschen.
          Der Anbieter kann das Vertragsverhältnis aus wichtigem Grund kündigen, insbesondere bei Verstößen
          gegen diese AGB oder bei missbräuchlicher Nutzung.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>11. Schlussbestimmungen</Text>
        <Text style={styles.body}>
          Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts, soweit zulässig.
          Für Verbraucher gelten zwingende Verbraucherschutzbestimmungen des Staates, in dem der Verbraucher
          seinen gewöhnlichen Aufenthalt hat.{"\n\n"}
          Sollten einzelne Bestimmungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen
          Bestimmungen unberührt.{"\n\n"}
          Stand: 29.01.2026
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
    fontSize: 26,
    fontWeight: "400",
    color: "#111",
    marginBottom: 6,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 0,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7d997dff",
    marginBottom: 10,
  },

  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },

  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111",
    fontWeight: "600",
  },

  note: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    marginTop: 6,
  },

  noteText: { fontSize: 13, lineHeight: 18, color: "#7C2D12" },
});
