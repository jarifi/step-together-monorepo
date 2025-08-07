import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

export const getUsers = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const res = await fetch(`${BASE_URL}/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const users = await res.json();

    if (!res.ok) {
      throw new Error(users.message || 'Failed to fetch users');
    }

    return users.map((u, i) => ({
      ...u,
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};
