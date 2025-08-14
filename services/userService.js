import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;


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

export const updateUser = async (id, data) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const updatedUser = await res.json();

    if (!res.ok) {
      throw new Error(updatedUser.message || 'Failed to update user');
    }

    return updatedUser;
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};

export async function createUser(userData) {
  const token = await AsyncStorage.getItem('userToken');

  const res = await fetch(`${BASE_URL}/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    let errorMessage = `Failed to create user: ${res.status}`;
    try {
      const errorBody = await res.json();
      errorMessage = JSON.stringify(errorBody);
    } catch (e) {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export const deleteUser = async (id) => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return true;
};