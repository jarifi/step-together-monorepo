// file: services/challengeService.js
import { apiDelete, apiGet, apiPost, apiPut } from './api';

// ---------------------------------------------------------------------------
// CHALLENGES
// ---------------------------------------------------------------------------

export const getChallenges = async (skip = 0, limit = 10) => {
  try {
    return await apiGet(`/challenges/?skip=${skip}&limit=${limit}`);
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return [];
  }
};

export const getChallengeById = async (id) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    return await apiGet(`/challenges/${id}`);
  } catch (err) {
    console.error('Error fetching challenge by id:', err);
    throw err;
  }
};

export const getChallengeTeams = async (id) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    return await apiGet(`/challenges/${id}/teams`);
  } catch (err) {
    console.error('Error fetching challenge teams:', err);
    throw err;
  }
};

export const updateChallenge = async (id, data) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    return await apiPut(`/challenges/${id}`, data);
  } catch (err) {
    console.error('Error updating challenge:', err);
    throw err;
  }
};

export const createChallenge = async (data) => {
  try {
    return await apiPost(`/challenges`, data);
  } catch (err) {
    console.error('Error creating challenge:', err);
    throw err;
  }
};

export const deleteChallenge = async (id) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    await apiDelete(`/challenges/${id}`);
    return true;
  } catch (err) {
    console.error('Error deleting challenge:', err);
    throw err;
  }
};

export const getChallengeHistory = async () => {
  try {
    return await apiGet(`/challenges/me/history`);
  } catch (err) {
    console.error('Error fetching challenge history:', err);
    return [];
  }
};
