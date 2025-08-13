import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export const getHomeInit = async () => {
  try {
    if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No auth token found');

    const res = await fetch(`${BASE_URL}/users/home/init`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

    return json;
  } catch (err) {
    console.error('Error fetching home init:', err);
    return null;
  }
};

