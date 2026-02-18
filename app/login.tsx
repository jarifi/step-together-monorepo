// file: app/login.tsx

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Constants from "expo-constants";
import { router } from "expo-router";

import { useUser } from "../context/UserContext";
import { saveTokens, saveUserId, saveUserRole } from "../lib/auth";
import { isValidEmail } from "../services/authClient";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

if (__DEV__) console.log("DEBUG: Current API URL is:", API_BASE_URL);

const PRIVACY_POLICY_TEXT = `
1. Verarbeitete Daten
Wir verarbeiten im Rahmen der App-Nutzung:
- E-Mail-Adresse
- Benutzer-ID
- Team- und Challenge-Daten
- ggf. Schritt-/Aktivitätsdaten
- technische Log-Daten

2. Zweck
Die Verarbeitung dient der Bereitstellung der App, der Durchführung von Challenges, der Benutzerverwaltung sowie der technischen Sicherheit.

3. Speicherung
Die Speicherung und Verarbeitung der Daten erfolgt auf Servern innerhalb der Europäischen Union (EU). Eine Übermittlung in Drittstaaten erfolgt nicht, sofern dies nicht gesetzlich erforderlich ist.

4. Speicherdauer
Daten werden nur so lange gespeichert, wie das Benutzerkonto besteht oder gesetzliche Pflichten dies erfordern.

5. Rechte
Nutzer haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch gemäß DSGVO.
`;



async function loginRequest(params: {
  baseUrl: string;
  email: string;
  password: string;
  privacyPolicyAccepted: boolean;
}) {
  const res = await fetch(`${params.baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      privacyPolicyAccepted: params.privacyPolicyAccepted,
    }),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const detail =
      data?.detail ?? data?.message ?? text ?? `Login failed (${res.status})`;
    const err: any = new Error(detail);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [policyRequiredNow, setPolicyRequiredNow] = useState(false);

  const [isPending, setIsPending] = useState(false);

  // ✅ Modal state
  const [policyModalVisible, setPolicyModalVisible] = useState(false);

  const { setUser, setToken, setUserId } = useUser();

  const clearError = () => {
    setErrorMessage(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current as any);
    errorTimerRef.current = null;
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current as any);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
  };

  const handleLogin = async () => {
    if (isPending) return;
    clearError();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!isValidEmail(trimmedEmail)) {
      showError("Bitte gültige E-Mail eingeben");
      return;
    }
    if (!trimmedPassword) {
      showError("Bitte gültiges Passwort eingeben");
      return;
    }

    if (policyRequiredNow && !privacyPolicyAccepted) {
      showError("Bitte akzeptiere die Datenschutzerklärung, um fortzufahren.");
      return;
    }

    setIsPending(true);
    try {
      const data = await loginRequest({
        baseUrl: API_BASE_URL,
        email: trimmedEmail,
        password: trimmedPassword,
        privacyPolicyAccepted: privacyPolicyAccepted === true,
      });

      await saveTokens(data.accessToken, data.refreshToken);
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      if (data.role) await saveUserRole(data.role);

      setUser({
        id: data.userId,
        email: trimmedEmail,
        role: data.role,
        teamId: data.teamId,
        activeChallengeId: data.activeChallengeId,
      });

      setPolicyRequiredNow(false);
      router.replace("/dashboard");
    } catch (err: any) {
      if (__DEV__) {
        console.log("LOGIN ERROR status:", err?.status);
        console.log("LOGIN ERROR detail:", err?.message);
        console.log("LOGIN ERROR data:", err?.data);
      }

      if (Number(err?.status) === 403) {
        setPolicyRequiredNow(true);
        showError(
          err?.message ?? "Bitte akzeptiere die Datenschutzerklärung, um fortzufahren."
        );
      } else {
        showError(err?.message ?? "Unbekannter Fehler");
      }
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current as any);
    };
  }, []);

  const loginDisabled = isPending || (policyRequiredNow && !privacyPolicyAccepted);

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.title}>Willkommen</Text>

          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            testID="login-email"
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Passwort"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              testID="login-password"
            />

            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={10}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#fff"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              setPrivacyPolicyAccepted((prev) => !prev);
              clearError();
            }}
            style={styles.policyRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: privacyPolicyAccepted }}
            testID="login-privacy-checkbox"
          >
            <View style={[styles.checkbox, privacyPolicyAccepted && styles.checkboxChecked]}>
              {privacyPolicyAccepted && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>

            <Text style={styles.policyText}>
              Ich akzeptiere die{" "}
              <Text
                style={styles.policyLink}
                onPress={() => setPolicyModalVisible(true)}
                suppressHighlighting
              >
                Datenschutzerklärung
              </Text>
            </Text>
          </Pressable>

          {errorMessage && (
            <Text style={styles.error} testID="login-error">
              {errorMessage}
            </Text>
          )}

          <Pressable
            style={[styles.button, loginDisabled && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: loginDisabled }}
            testID="login-submit"
          >
            <Text style={styles.buttonText}>
              {isPending ? "Wird eingeloggt…" : "Einloggen"}
            </Text>
          </Pressable>

          {policyRequiredNow && !privacyPolicyAccepted && (
            <Text style={styles.hint}>
              Beim ersten Login musst du die Datenschutzerklärung einmal akzeptieren.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={policyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Datenschutzerklärung</Text>

              <Pressable
                onPress={() => setPolicyModalVisible(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.modalText}>{PRIVACY_POLICY_TEXT.trim()}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setPolicyModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Schließen</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setPrivacyPolicyAccepted(true);
                  clearError();
                  setPolicyModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Akzeptieren</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#313633c7" },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 110,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  logo: { width: 250, height: 140, marginBottom: 32, marginTop: -100 },

  card: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "rgba(94, 103, 81, 0.83)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  title: {
    fontSize: 26,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "rgba(108, 118, 96, 0.65)",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(108, 118, 96, 0.65)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 16,
    fontSize: 16,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 118, 96, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(108, 118, 96, 0.65)",
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 8,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },

  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 6,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: "#698059ff",
    borderColor: "#698059ff",
  },

  policyText: { color: "#fff", flex: 1, fontSize: 14, lineHeight: 18 },

  policyLink: {
    textDecorationLine: "underline",
    fontWeight: "700",
    color: "#fff",
  },

  hint: {
    marginTop: 6,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#698059ff",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },

  buttonDisabled: { opacity: 0.55 },

  buttonText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "600" },

  error: { color: "#ff6b6b", marginBottom: 10, textAlign: "center" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 16,
  },

  modalCard: {
    borderRadius: 16,
    backgroundColor: "rgba(94, 103, 81, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    maxHeight: "80%",
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBody: {
    paddingHorizontal: 16,
  },

  modalBodyContent: {
    paddingVertical: 14,
  },

  modalText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },

  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalButtonPrimary: {
    backgroundColor: "#698059ff",
  },

  modalButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
