import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  fromIsoLocal,
  inSameDayIso,
  toIsoDate,
  toIsoDateTimeMidnight,
} from '../../app/dashboard/dashboardDto';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

const PATHS = {
  init: '/users/user/dashboard/init',
  stepLogs: '/step_logs',
};

const joinUrl = (base, path) =>
  `${String(base || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+|\/+$/g, '')}`;

const authHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No auth token found');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const http = async (url, options) => {
  const res = await fetch(url, options);
  let payload = null;
  try { payload = await res.json(); } catch { payload = null; }

  if (!res.ok) {
    const msg =
      (payload && (payload.message || payload.detail)) ||
      (Array.isArray(payload?.detail) ? JSON.stringify(payload.detail) : null) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
};

// ---------- API: Dashboard-Init ----------
export const getHomeInit = async () => {
  if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
  const headers = await authHeaders();
  const url = joinUrl(BASE_URL, PATHS.init);
  return await http(url, { method: 'GET', headers });
};

// ---------- API: Step Logs ----------
export const listUserStepLogs = async (userId) => {
  if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
  if (userId === undefined || userId === null) throw new Error('userId required');

  const headers = await authHeaders();
  const base = joinUrl(BASE_URL, PATHS.stepLogs);
  const url = joinUrl(base, `user/${encodeURIComponent(String(userId))}`);
  return await http(url, { method: 'GET', headers });
};

// Hole eine bestimmte Woche (Mo..So) für einen User, clientseitig gefiltert
export const getWeekSteps = async (userId, weekStartISO) => {
  if (userId === undefined || userId === null) throw new Error('userId required');
  if (!weekStartISO) throw new Error('weekStartISO required');

  const all = await listUserStepLogs(userId); // Array von StepLogResponse
  const weekStart = fromIsoLocal(weekStartISO);
  if (!weekStart) return [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const withinWeek = (dateStr) => {
    const d = fromIsoLocal(dateStr || '');
    return d && d >= weekStart && d <= weekEnd;
  };

  // Mappe auf Format, das parseStepsThisWeek versteht
  return (all ?? [])
    .filter((x) => x?.date && withinWeek(x.date))
    .map((x) => {
      const d = fromIsoLocal(x.date);
      return {
        date: toIsoDate(d),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
        numberOfSteps:
          Number.isFinite(+x?.numberOfSteps) ? +x.numberOfSteps :
          Number.isFinite(+x?.steps) ? +x.steps : 0,
        step_log_id: x?.id, // nützlich fürs Update
      };
    });
};

// Upsert: existiert ein Log für dateISO → update, sonst create
export const upsertStepsForDate = async (
  userId,
  dateISO,
  absoluteSteps,
  context 
) => {
  if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
  if (userId === undefined || userId === null) throw new Error('userId required');
  if (!dateISO) throw new Error('dateISO required');

  const headers = await authHeaders();
  const base = joinUrl(BASE_URL, PATHS.stepLogs);

  // existierendes StepLog für das Datum finden
  const all = await listUserStepLogs(userId);
  const existing = (all ?? []).find((log) => log?.date && inSameDayIso(log.date, dateISO));

  if (existing?.id != null) {
    const id = String(existing.id);
    const url = joinUrl(base, id);

    const body = JSON.stringify({ numberOfSteps: Number(absoluteSteps) });
    return await http(url, { method: 'PUT', headers, body });
  }

  // --- CREATE ---
  if (!context?.challengeId || !context?.teamId) {
    throw new Error('challengeId/teamId required for create');
  }

  const url = base;
  const body = JSON.stringify({
    challengeId: context.challengeId,
    teamId: context.teamId,
    date: toIsoDateTimeMidnight(dateISO),
    numberOfSteps: Number(absoluteSteps),
  });
  return await http(url, { method: 'POST', headers, body });
};


