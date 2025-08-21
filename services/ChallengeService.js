import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export const getChallenges = async (skip = 0, limit = 10) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const res = await fetch(`${BASE_URL}/challenges/?skip=${skip}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const challenges = await res.json();

        if (!res.ok) {
            throw new Error(challenges.message || 'Failed to fetch challenges');
        }

        return challenges;
    } catch (err) {
        console.error('Error fetching challenges:', err);
        return [];
    }
};

export const updateChallenge = async (id, data) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const res = await fetch(`${BASE_URL}/challenges/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const updatedChallenge = await res.json();

        if (!res.ok) {
            throw new Error(updatedChallenge.message || 'Failed to update challenge');
        }

        return updatedChallenge;
    } catch (err) {
        console.error('Error updating challenge:', err);
        throw err;
    }
};

export const createChallenge = async (data) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/challenges/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const newChallenge = await res.json();
        if (!res.ok) {
            throw new Error(newChallenge.message || 'Failed to create challenge');
        }
        return newChallenge;
    } catch (err) {
        console.error('Error creating challenge:', err);
        throw err;
    }
};

export const deleteChallenge = async (id) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${BASE_URL}/challenges/${id}`, {
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