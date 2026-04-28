// file: services/challengeService.js
import { apiDelete, apiGet, apiPost, apiPut } from './api';

// ---------------------------------------------------------------------------
// CHALLENGES
// ---------------------------------------------------------------------------

export const getChallenges = async (skip = 0, limit = 10, state) => {
  try {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));

    if (state) {
      params.set('state', String(state));
    }

    return await apiGet(`/challenges/?${params.toString()}`);
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

export const getChallengeParticipants = async (id) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    const data = await apiGet(`/challenges/${id}/participants`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching challenge participants:', err);
    throw err;
  }
};

export const updateChallenge = async (id, data) => {
  if (!id) throw new Error('Challenge ID is required');
  try {
    return await apiPut(`/challenges/${id}`, data);
  } catch (err) {
    console.error('Error updating challenge:', err);

    const status = err?.status || err?.response?.status;
    const detail =
      err?.response?.data?.detail ||
      err?.data?.detail ||
      err?.detail ||
      err?.message ||
      '';

    const detailText = String(detail).toLowerCase();

    if (
      status === 409 &&
      detailText.includes('another challenge during this time period')
    ) {
      throw new Error(
        'Mindestens ein Teammitglied nimmt in diesem Zeitraum bereits an einer anderen Challenge teil.'
      );
    }

    throw new Error(detail || 'Challenge could not be updated.');
  }
};

export const createChallenge = async (data) => {
  try {
    return await apiPost(`/challenges/`, data);
  } catch (err) {
    console.error('Error creating challenge:', err);

    const status = err?.status || err?.response?.status;
    const detail =
      err?.response?.data?.detail ||
      err?.data?.detail ||
      err?.detail ||
      err?.message ||
      '';

    const detailText = String(detail).toLowerCase();

    if (
      status === 409 ||
      detailText.includes('already exists within this time frame')
    ) {
      throw new Error('Challenge within this time frame already exists.');
    }

    throw new Error(detail || 'Challenge could not be created.');
  }
};

export const getChallengeInvites = async (challengeId) => {
  if (!challengeId) return [];
  const data = await apiGet(`/challenges/${challengeId}/invites`);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.invites)) return data.invites;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const createBulkChallengeInvites = async (challengeId, inviteeUserIds) => {
  if (!challengeId || !inviteeUserIds?.length) return null;
  try {
    return await apiPost(`/challenges/${challengeId}/invites/bulk`, {
      inviteeUserIds,
    });
  } catch (err) {
    console.error('Error creating bulk invites:', err);
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

export const getMyChallenges = async () => {
  try {
    return await apiGet(`/challenges/me/created`);
  } catch (err) {
    console.error('Error fetching my challenges:', err);
    return [];
  }
};

export const getMyActiveChallenges = async () => {
  try {
    const data = await apiGet(`/challenges/me/active`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching active challenges:', err);
    return [];
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

export const getActiveParticipantsCounts = async () => {
  try {
    return await apiGet(`/challenges/challenge_participants/count-active`);
  } catch (err) {
    console.error('Error fetching active participants:', err);
    return [];
  }
};

export const getMyInvites = async () => {
  try {
    const data = await apiGet(`/challenges/me/invites`);

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching my invites:', err);
    return [];
  }
};

export const acceptChallengeInvite = async (challengeId, inviteId) => {
  if (!challengeId || !inviteId) throw new Error('Missing IDs');
  try {
    return await apiPost(`/challenges/${challengeId}/invites/${inviteId}/accept`, {});
  } catch (err) {
    console.error('Error accepting challenge invite:', err);
    throw err;
  }
};

export const declineChallengeInvite = async (challengeId, inviteId) => {
  if (!challengeId || !inviteId) throw new Error('Missing IDs');
  try {
    return await apiPost(`/challenges/${challengeId}/invites/${inviteId}/decline`, {});
  } catch (err) {
    console.error('Error declining challenge invite:', err);
    throw err;
  }
};
