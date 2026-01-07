//file: lib/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';
const USER_ROLE_KEY = 'role';

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
export const refreshAccessToken = async (apiBaseUrl: string): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
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
