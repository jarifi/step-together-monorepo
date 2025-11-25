import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../../context/UserContext";
import { updateUser } from "../../services/userService";

export default function ProfileUpdateScreen() {
  const { user, setUser, userId } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);

      // falls dein User bereits ein Avatar-Feld hat:
      if (user.avatarUrl) {
        setImageUri(user.avatarUrl);
      }
    }
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Zugriff benötigt",
        "Bitte erlaube den Zugriff auf deine Fotos, um ein Profilbild zu wählen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = { name, email };

      // wenn dein Backend ein Feld für Avatar kennt, z.B. avatarUrl:
      if (imageUri) {
        payload.avatarUrl = imageUri;
      }

      const updatedUser = await updateUser(userId, payload);

      setUser(updatedUser);

      Alert.alert("Success", "Benutzer erfolgreich aktualisiert!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Benutzer konnte nicht aktualisiert werden");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Pressable style={styles.avatarCircle} onPress={handlePickImage}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials || "??"}</Text>
            )}
          </Pressable>

          <Text style={styles.profileName}>{name || "Dein Name"}</Text>
          <View style={styles.emailBadge}>
            <Text style={styles.emailBadgeText}>
              {email || "email@example.com"}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              style={styles.input}
              editable={!loading}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-Mail"
              style={styles.input}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable style={styles.passwordRow} onPress={() => {}}>
            <View>
              <Text style={styles.passwordLabel}>Passwort ändern</Text>
              <Text style={styles.passwordHint}>
                Sicherheit deines Kontos verwalten
              </Text>
            </View>
            <Text style={styles.passwordChevron}>›</Text>
          </Pressable>

          <Pressable
            onPress={handleUpdate}
            disabled={loading}
            style={[styles.updateButton, loading && styles.disabledButton]}
          >
            <Text style={styles.updateText}>
              {loading ? "Aktualisierung..." : "Aktualisieren"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f5efff",
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#bac9baff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2933",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emailBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#e9e9e9ff",
  },
  emailBadgeText: {
    fontSize: 13,
    color: "#4B5563",
  },
  formSection: {
    gap: 16,
  },
  fieldWrapper: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
  },
  passwordRow: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passwordLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  passwordHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  passwordChevron: {
    fontSize: 20,
    color: "#9CA3AF",
    marginLeft: 12,
  },
  updateButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#658869ff",
  },
  updateText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
