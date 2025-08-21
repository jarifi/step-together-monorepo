import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export const getTeams = async (skip = 0, limit = 10) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const res = await fetch(`${BASE_URL}/teams/?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const teams = await res.json();

    if (!res.ok) {
      throw new Error(teams.message || 'Failed to fetch teams');
    }

    return teams;
  } catch (err) {
    console.error('Error fetching teams:', err);
    return [];
  }
};

export const updateTeam = async (id, data) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const res = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const updatedTeam = await res.json();

    if (!res.ok) {
      throw new Error(updatedTeam.message || 'Failed to update team');
    }

    return updatedTeam;
  } catch (err) {
    console.error('Error updating team:', err);
    throw err;
  }
};

export const createTeam = async (data) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const res = await fetch(`${BASE_URL}/teams/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const newTeam = await res.json();
    if (!res.ok) {
      throw new Error(newTeam.message || 'Failed to create team');
    }
    return newTeam;
  } catch (err) {
    console.error('Error creating team:', err);
    throw err;
  }
};

export const getTeamRanking = async (teamId, challengeId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const res = await fetch(
      `${BASE_URL}/teams/members/active_challenge/${teamId}/${challengeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch team ranking');

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching team ranking:', err);
    return [];
  }
};