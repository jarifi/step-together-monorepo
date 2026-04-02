//file: lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const USER_ROLE_KEY = "role";
const LAST_EMAIL_KEY = "lastEmail";
const SECURE_PASSWORD_KEY = "securePassword";

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const saveUserId = async (id: string) => {
  await AsyncStorage.setItem(USER_ID_KEY, id);
};

export const saveUserRole = async (id: string) => {
  await AsyncStorage.setItem(USER_ROLE_KEY, id);
};

export const getUserId = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ID_KEY);
};

export const getUserRole = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ROLE_KEY);
};

export const removeTokens = async () => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
  await AsyncStorage.removeItem(USER_ROLE_KEY);
};

export const isLoggedIn = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return !!token;
};

// --- NEW: Refresh access token ---
export const refreshAccessToken = async (
  apiBaseUrl: string,
): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { accessToken?: string };
    if (data.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
};

// --- NEW: Check if device supports biometric authentication (passkeys) ---
export const isPasskeySupported = async (): Promise<boolean> => {
  try {
    // Check if device has biometric hardware available
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    // Check if user has enrolled biometrics (fingerprint, face, etc.)
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.warn("Passkey support check failed:", error);
    return false;
  }
};

// --- NEW: Authenticate using biometric passkey ---
export const authenticateWithPasskey = async (
  reason: string,
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      promptMessage: reason,
    });
    return result.success;
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return false;
  }
};

// --- NEW: Save last used email for passkey login ---
export const saveLastEmail = async (email: string) => {
  await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
};

// --- NEW: Get last used email ---
export const getLastEmail = async (): Promise<string | null> => {
  return AsyncStorage.getItem(LAST_EMAIL_KEY);
};

// --- NEW: Save password securely for passkey login ---
export const savePasswordSecurely = async (password: string) => {
  try {
    await SecureStore.setItemAsync(SECURE_PASSWORD_KEY, password);
  } catch (error) {
    console.error("Failed to save password securely:", error);
  }
};

// --- NEW: Get password securely ---
export const getPasswordSecurely = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(SECURE_PASSWORD_KEY);
  } catch (error) {
    console.error("Failed to retrieve password:", error);
    return null;
  }
};

// --- NEW: Remove stored password ---
export const removePasswordSecurely = async () => {
  try {
    await SecureStore.deleteItemAsync(SECURE_PASSWORD_KEY);
  } catch (error) {
    console.error("Failed to remove password:", error);
  }
};
