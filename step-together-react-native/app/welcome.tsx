import { Ionicons } from "@expo/vector-icons";
import { Pedometer } from "expo-sensors";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [hasActivityPermission, setHasActivityPermission] = useState(false);

  const checkActivityPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

    // ACTIVITY_RECOGNITION is runtime on Android 10+.
    if (typeof Platform.Version === "number" && Platform.Version < 29) {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );
      if (granted) return true;
    } catch {
      // Continue with pedometer permission fallback below.
    }

    try {
      const pedometerApi = Pedometer as unknown as {
        getPermissionsAsync?: () => Promise<{ status?: string }>;
      };
      if (pedometerApi.getPermissionsAsync) {
        const res = await pedometerApi.getPermissionsAsync();
        return res?.status === "granted";
      }
    } catch {
      // Keep false when we cannot verify grant.
    }

    return false;
  }, []);

  const requestActivityPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

    // ACTIVITY_RECOGNITION is runtime on Android 10+.
    if (typeof Platform.Version === "number" && Platform.Version < 29) {
      return true;
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: "Aktivitaetserkennung erlauben",
          message:
            "Step Together braucht Aktivitaetserkennung, um Schritte zu tracken.",
          buttonNegative: "Ablehnen",
          buttonPositive: "Erlauben",
        }
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
    } catch {
      // Fallback below.
    }

    try {
      const pedometerApi = Pedometer as unknown as {
        requestPermissionsAsync?: () => Promise<{ status?: string }>;
      };
      if (pedometerApi.requestPermissionsAsync) {
        const res = await pedometerApi.requestPermissionsAsync();
        return res?.status === "granted";
      }
    } catch {
      // Keep false when request fails.
    }

    return false;
  }, []);

  const refreshPermissionState = useCallback(async () => {
    setPermissionLoading(true);
    const granted = await checkActivityPermission();
    setHasActivityPermission(granted);
    setPermissionLoading(false);
  }, [checkActivityPermission]);

  useEffect(() => {
    refreshPermissionState();
  }, [refreshPermissionState]);

  const handleGrantPermission = useCallback(async () => {
    setPermissionLoading(true);
    const granted = await requestActivityPermission();
    if (!granted) {
      const current = await checkActivityPermission();
      setHasActivityPermission(current);
      setPermissionLoading(false);
      return;
    }

    setHasActivityPermission(true);
    setPermissionLoading(false);
  }, [checkActivityPermission, requestActivityPermission]);

  const handleLogin = useCallback(() => {
    if (!hasActivityPermission) return;
    router.push("/login");
  }, [hasActivityPermission]);

  const handleRegister = useCallback(() => {
    if (!hasActivityPermission) return;
    router.push("/register");
  }, [hasActivityPermission]);

  const permissionBlocked = Platform.OS === "android" && !hasActivityPermission;

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.container}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Step Together</Text>
        <Text style={styles.subtitle}>
          Tracke deine Schritte, Tritt challenges an und bleibe aktiv zusammen.
        </Text>

        {permissionLoading ? (
          <View style={styles.permissionCard}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.permissionText}>Pruefe Aktivitaetsberechtigung...</Text>
          </View>
        ) : permissionBlocked ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Berechtigung erforderlich</Text>
            <Text style={styles.permissionText}>
              Bitte erlaube Aktivitaetserkennung, bevor du dich einloggst.
            </Text>
            <View style={styles.permissionButtons}>
              <Pressable
                style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
                onPress={handleGrantPermission}
              >
                <Text style={styles.permissionButtonText}>Erlauben</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.permissionButtonSecondary, pressed && styles.pressed]}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.permissionButtonText}>Einstellungen</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.buttonGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              permissionBlocked && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleLogin}
            disabled={permissionBlocked}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              permissionBlocked && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleRegister}
            disabled={permissionBlocked}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Register</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#313633c7",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logo: {
    width: 250,
    height: 140,
    marginBottom: 28,
  },

  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
    maxWidth: 320,
  },

  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 14,
  },

  permissionCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },

  permissionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  permissionText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },

  permissionButtons: {
    flexDirection: "row",
    gap: 10,
  },

  permissionButton: {
    flex: 1,
    backgroundColor: "#698059ff",
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },

  permissionButtonSecondary: {
    flex: 1,
    backgroundColor: "#4f5f48",
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },

  permissionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#698059ff",
    paddingVertical: 14,
    borderRadius: 10,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#556b4d",
    paddingVertical: 14,
    borderRadius: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});