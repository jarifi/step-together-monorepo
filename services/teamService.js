// file: services/teamService.js
import { apiDelete, apiGet, apiPost, apiPut } from './api';

// ---------------------------------------------------------------------------
// TEAMS
// ---------------------------------------------------------------------------

export const getTeams = async (skip = 0, limit = 10) => {
  const path = `/teams/?skip=${skip}&limit=${limit}`;
  try {
    return await apiGet(path);
  } catch (err) {
    console.error('Error fetching teams:', err);
    return [];
  }
};

export const updateTeam = async (id, data) => {
  if (!id) throw new Error('Team ID is required');
  try {
    return await apiPut(`/teams/${id}/`, data);
  } catch (err) {
    console.error('Error updating team:', err);
    throw err;
  }
};

export const createTeam = async (data) => {
  try {
    return await apiPost(`/teams/`, data);
  } catch (err) {
    console.error('Error creating team:', err);
    throw err;
  }
};

export const deleteTeam = async (id) => {
  if (!id) throw new Error('Team ID is required');
  try {
    await apiDelete(`/teams/${id}/`);
    return true;
  } catch (err) {
    console.error('Error deleting team:', err);
    throw err;
  }
};

export const getTeamRanking = async (teamId, challengeId) => {
  if (!teamId || !challengeId) throw new Error('teamId and challengeId required');
  try {
    const path = `/teams/members/active_challenge/${teamId}/${challengeId}/`;
    const data = await apiGet(path);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching team ranking:', err);
    return [];
  }
};

export const getTeamMembers = async (teamId) => {
  if (!teamId) throw new Error('teamId is required');

  try {
    const path = `/teams/${teamId}/members/`;
    const data = await apiGet(path);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching team members:', err);
    return [];
  }
};

export const getAllTeams = async (pageSize = 100) => {
  try {
    let skip = 0;
    let allTeams = [];
    let hasMore = true;

    while (hasMore) {
      const chunk = await getTeams(skip, pageSize);
      const safeChunk = Array.isArray(chunk) ? chunk : [];

      allTeams = [...allTeams, ...safeChunk];

      if (safeChunk.length < pageSize) {
        hasMore = false;
      } else {
        skip += safeChunk.length;
      }
    }

    return allTeams;
  } catch (err) {
    console.error('Error fetching all teams:', err);
    return [];
  }
};