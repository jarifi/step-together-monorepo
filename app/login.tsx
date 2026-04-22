import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

if (__DEV__) console.log("DEBUG: Current API URL is:", API_BASE_URL);

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
  const [isPending, setIsPending] = useState(false);
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false);

  const { setUser, setToken, setUserId } = useUser();

  const clearError = () => {
    setErrorMessage(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = null;
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
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

      showError(err?.message ?? "Unbekannter Fehler");
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
      showError(err?.message ?? "Fehler bei Passkey-Anmeldung");
    } finally {
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
});