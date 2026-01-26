// file: app/login.tsx

import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Constants from "expo-constants";
import { router } from "expo-router";

import { useUser } from "../context/UserContext";
import { useLogin } from "../hooks/useLogin";
import { saveTokens, saveUserId, saveUserRole } from "../lib/auth";
import { isValidEmail } from "../services/authClient";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;
if (__DEV__) {
  console.log("DEBUG: Current API URL is:", API_BASE_URL);
}
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser, setToken, setUserId } = useUser();

  const { mutateAsync: loginMutate, isPending } = useLogin({
    baseUrl: API_BASE_URL,
  });

  const handleLogin = async () => {
    if (isPending) return;
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Minimal client-side validation to avoid unnecessary requests
    const emailLooksValid = isValidEmail(trimmedEmail);
    if (!emailLooksValid) {
      showError("Bitte gültige E-Mail eingeben");
      return;
    }
    if (!trimmedPassword) {
      showError("Bitte gültiges Passwort eingeben");
      return;
    }

    try {
      const data = await loginMutate({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      await saveTokens(data.accessToken, data.refreshToken);
      await saveUserId(String(data.userId));

      setToken(data.accessToken);
      setUserId(String(data.userId));

      if (data.role) {
        await saveUserRole(data.role);
        if (__DEV__) {
          console.log("✅ Login - Role saved:", data.role);
        }
      } else if (__DEV__) {
        console.log("⚠️ Login - No role found in response data");
      }

      const userObject = {
        id: data.userId,
        email: trimmedEmail,
        role: data.role,
        teamId: data.teamId,
        activeChallengeId: data.activeChallengeId,
      };

      setUser(userObject);
      if (__DEV__) {
        console.log("🔍 Login - User data created:", userObject);
      }

      router.replace("/dashboard");
    } catch (err: any) {
      const message = err?.message ?? "Unbekannter Fehler";
      showError(message);
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current as unknown as number);
    }
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current as unknown as number);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* LOGO */}
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* LOGIN CARD */}
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
              <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "🐵"}</Text>
            </Pressable>
          </View>


          {errorMessage && (
            <Text style={styles.error} testID="login-error">
              {errorMessage}
            </Text>
          )}

          <Pressable
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isPending}
            accessibilityState={{ disabled: isPending }}
            accessibilityRole="button"
            testID="login-submit"
          >
            <Text style={styles.buttonText}>
              {isPending ? "Wird eingeloggt…" : "Einloggen"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    paddingBottom: 110,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  logo: {
    width: 250,
    height: 150,
    marginBottom: 52,
  },

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

  button: {
    backgroundColor: "#698059ff",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "#ff6b6b",
    marginBottom: 10,
    textAlign: "center",
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
    marginBottom: 16,
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

  eyeIcon: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
  },
});
