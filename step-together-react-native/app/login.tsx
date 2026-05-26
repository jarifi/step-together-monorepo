import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Constants from "expo-constants";
import { router } from "expo-router";

import { useUser } from "../context/UserContext";
import { authenticateWithPasskey, getLastEmail, getPasswordSecurely, isPasskeySupported, saveLastEmail, savePasswordSecurely, saveTokens, saveUserId, saveUserRole } from "../lib/auth";
import { isValidEmail } from "../services/authClient";
import { acceptPrivacyPolicy } from "../services/userService";

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
    }),
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    let detail: string;
    if (Array.isArray(data?.detail)) {
      detail = data.detail.map((d: any) => d.msg ?? String(d)).join('\n');
    } else {
      detail = data?.detail ?? data?.message ?? text ?? `Login failed (${res.status})`;
    }
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
  const [isPending, setIsPending] = useState(false);
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false);

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const pendingCredentials = useRef<{ email: string; password: string } | null>(null);

  const { setUser, setToken, setUserId } = useUser();

  const clearError = () => {
    setErrorMessage(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = null;
  };

  const showError = (message: string, persistent = false) => {
    setErrorMessage(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (!persistent) {
      errorTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleLogin = async () => {
    if (isPending) return;
    clearError();

    const normalizedEmail = email.trim().toLowerCase();
    const rawPassword = password;

    if (!isValidEmail(normalizedEmail)) {
      showError("Bitte gültige E-Mail eingeben");
      return;
    }

    if (!rawPassword) {
      showError("Bitte gültiges Passwort eingeben");
      return;
    }

    setIsPending(true);

    try {
      const data = await loginRequest({
        baseUrl: API_BASE_URL,
        email: normalizedEmail,
        password: rawPassword,
      });

      // Save for next login
      await saveLastEmail(normalizedEmail);
      await savePasswordSecurely(rawPassword);

      await saveTokens(data.accessToken, data.refreshToken);
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      if (data.role) await saveUserRole(data.role);

      setUser({
        id: data.userId,
        email: normalizedEmail,
        role: data.role,
        teamId: data.teamId,
        activeChallengeId: data.activeChallengeId,
        activeChallenges: data.activeChallenges,
      });

      router.replace("/challenges/challengesDashboard");
    } catch (err: any) {
      if (__DEV__) {
        console.log("LOGIN ERROR status:", err?.status);
        console.log("LOGIN ERROR detail:", err?.message);
        console.log("LOGIN ERROR data:", err?.data);
      }

      const status = err?.status;
      const msg: string = err?.message ?? "";
      const isLocked =
        status === 429 ||
        status === 423 ||
        /gesperrt|locked|banned|suspended|zu viele/i.test(msg);
      const needsPrivacyAccept =
        status === 403 && /Datenschutz/i.test(msg);

      if (needsPrivacyAccept) {
        pendingCredentials.current = { email: normalizedEmail, password: rawPassword };
        setPrivacyModalVisible(true);
      } else if (isLocked) {
        showError(msg || "Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.", true);
      } else if (status === 401 || status === 403 || status === 400 || status === 422) {
        showError("Ungültige Anmeldedaten");
      } else {
        showError(msg || "Unbekannter Fehler");
      }
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    checkPasskeyAvailability();
    loadLastEmail();
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const loadLastEmail = async () => {
    try {
      const lastEmail = await getLastEmail();
      if (lastEmail) {
        setEmail(lastEmail);
      }
      const lastPassword = await getPasswordSecurely();
      if (lastPassword) {
        setPassword(lastPassword);
      }
    } catch (error) {
      console.warn('Failed to load last email/password:', error);
    }
  };

  const checkPasskeyAvailability = async () => {
    try {
      const available = await isPasskeySupported();
      setIsPasskeyAvailable(available);
    } catch (error) {
      console.warn('Failed to check passkey availability:', error);
      setIsPasskeyAvailable(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (isPending) return;
    clearError();

    const trimmedEmail = email.trim();

    // Check email is filled and valid
    if (!trimmedEmail) {
      showError("Bitte E-Mail eingeben");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      showError("Bitte gültige E-Mail eingeben");
      return;
    }

    setIsPending(true);

    try {
      // Authenticate using biometric
      const authenticated = await authenticateWithPasskey(
        "Authentifiziere dich mit deinem Fingerabdruck oder Gesicht"
      );

      if (!authenticated) {
        showError("Biometrische Authentifizierung abgebrochen");
        setIsPending(false);
        return;
      }

      // Save email for next login
      await saveLastEmail(trimmedEmail);

      let trimmedPassword = password.trim();

      // If password field is empty, try to get stored password
      if (!trimmedPassword) {
        const storedPassword = await getPasswordSecurely();
        if (storedPassword) {
          trimmedPassword = storedPassword;
        } else {
          showError("Passwort erforderlich");
          setIsPending(false);
          return;
        }
      }

      const data = await loginRequest({
        baseUrl: API_BASE_URL,
        email: trimmedEmail,
        password: trimmedPassword,
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
        activeChallenges: data.activeChallenges,
      });

      router.replace("/challenges/challengesDashboard");
    } catch (err: any) {
      if (__DEV__) {
        console.log("PASSKEY LOGIN ERROR:", err?.message);
      }
      const status = err?.status;
      const msg: string = err?.message ?? "";
      const isLocked =
        status === 429 ||
        status === 423 ||
        /gesperrt|locked|banned|suspended|zu viele/i.test(msg);
      const needsPrivacyAccept =
        status === 403 && /Datenschutz/i.test(msg);

      if (needsPrivacyAccept) {
        pendingCredentials.current = { email: trimmedEmail, password: trimmedPassword };
        setPrivacyModalVisible(true);
      } else if (isLocked) {
        showError(msg || "Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.", true);
      } else if (status === 401 || status === 403 || status === 400 || status === 422) {
        showError("Ungültige Anmeldedaten");
      } else {
        showError(msg || "Fehler bei Passkey-Anmeldung");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleAcceptPrivacyPolicy = async () => {
    const creds = pendingCredentials.current;
    if (!creds) return;

    setPrivacyModalVisible(false);
    setIsPending(true);

    try {
      await acceptPrivacyPolicy(creds.email, creds.password);
      const data = await loginRequest({
        baseUrl: API_BASE_URL,
        email: creds.email,
        password: creds.password,
      });

      await saveLastEmail(creds.email);
      await savePasswordSecurely(creds.password);
      await saveTokens(data.accessToken, data.refreshToken);
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      if (data.role) await saveUserRole(data.role);

      setUser({
        id: data.userId,
        email: creds.email,
        role: data.role,
        teamId: data.teamId,
        activeChallengeId: data.activeChallengeId,
        activeChallenges: data.activeChallenges,
      });

      router.replace("/challenges/challengesDashboard");
    } catch (err: any) {
      showError(err?.message || "Fehler beim Akzeptieren der Datenschutzerklärung.");
    } finally {
      pendingCredentials.current = null;
      setIsPending(false);
    }
  };

  const loginDisabled = isPending;

  return (
    <SafeAreaView style={styles.background}>
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
          <Text style={styles.title}>Willkommen zurück</Text>
          <Text style={styles.subtitle}>
            Melde dich an und mach bei deinen Challenges weiter.
          </Text>

          <Text style={styles.label}>E-MAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"          // Crucial for Android
            textContentType="emailAddress" // Crucial for iOS
            importantForAutofill="yes"    // Tells Android to prioritize this
            keyboardType="email-address"
            testID="login-email"
          />

          <Text style={styles.label}>PASSWORT</Text>
          <View style={styles.passwordWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#fff" />

            <TextInput
              style={styles.passwordInput}
              placeholder="Passwort"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"       // Crucial for Android
              textContentType="password"    // Crucial for iOS
              importantForAutofill="yes"
              testID="login-password"
            />

            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={10}
              style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#fff"
              />
            </Pressable>
          </View>

          {errorMessage && (
            <Text style={styles.error} testID="login-error">
              {errorMessage}
            </Text>
          )}

          {isPasskeyAvailable && (
            <Pressable
              style={({ pressed }) => [
                styles.passkeyBtn,
                pressed && styles.pressed,
                isPending && styles.buttonDisabled,
                (!email.trim() || !isValidEmail(email.trim())) && styles.buttonDisabled,
              ]}
              onPress={handlePasskeyLogin}
              disabled={isPending || !email.trim() || !isValidEmail(email.trim())}
              accessibilityRole="button"
              accessibilityState={{ disabled: isPending || !email.trim() || !isValidEmail(email.trim()) }}
              testID="login-passkey"
            >
              <Ionicons name="finger-print" size={20} color="#fff" />
              <Text style={styles.passkeyBtnText}>
                {isPending ? "Wird authentifiziert…" : "Mit Passkey anmelden"}
              </Text>
            </Pressable>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => router.back()}
              disabled={isPending}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Zurück</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                loginDisabled && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loginDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: loginDisabled }}
              testID="login-submit"
            >
              <Text style={styles.primaryBtnText}>
                {isPending ? "Wird eingeloggt…" : "Weiter"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/register")}
            style={({ pressed }) => [styles.registerLinkWrap, pressed && styles.pressed]}
          >
            <Text style={styles.registerText}>
              Noch kein Konto?{" "}
              <Text style={styles.registerLink}>Registrieren</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Datenschutzerklärung</Text>
              <Pressable onPress={() => setPrivacyModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.modalIntro}>
              <Text style={styles.modalIntroText}>
                Um die App zu nutzen, musst du unsere Datenschutzerklärung akzeptieren.
              </Text>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{PRIVACY_POLICY_TEXT.trim()}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalButtonSecondary}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Ablehnen</Text>
              </Pressable>
              <Pressable
                style={styles.modalButtonPrimary}
                onPress={handleAcceptPrivacyPolicy}
                disabled={isPending}
              >
                <Text style={styles.modalButtonText}>
                  {isPending ? "Wird verarbeitet…" : "Akzeptieren"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
  },

  logo: {
    width: 240,
    height: 130,
    marginBottom: 40,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "rgba(94, 103, 81, 0.83)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 100,
  },

  title: {
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    marginLeft: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  input: {
    backgroundColor: "rgba(108, 118, 96, 0.65)",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(108, 118, 96, 0.65)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 14,
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
    marginBottom: 10,
  },

  passwordInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginLeft: 10,
  },

  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    color: "#ff8d8d",
    marginBottom: 10,
    textAlign: "center",
  },

  passkeyBtn: {
    flexDirection: "row",
    backgroundColor: "rgba(105, 128, 89, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  passkeyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  primaryBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "#698059ff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  secondaryBtnText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 15,
  },

  registerLinkWrap: {
    marginTop: 18,
    alignItems: "center",
  },

  registerText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },

  registerLink: {
    color: "#fff",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#4a5240",
    borderRadius: 15,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  modalIntro: {
    padding: 15,
    paddingBottom: 0,
  },

  modalIntroText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },

  modalBody: {
    padding: 15,
    maxHeight: 300,
  },

  modalText: {
    color: "#fff",
    lineHeight: 20,
    fontSize: 13,
  },

  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 15,
  },

  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#698059ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});