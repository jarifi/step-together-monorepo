import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

const PATHS = {
  init: '/users/user/dashboard/init',     
  stepLogs: 'step_logs',          
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

// ---------- Helpers für Datumslogik ----------
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// ISO “YYYY-MM-DD” → Date (lokal, ohne UTC-Shift)
const fromIsoLocal = (s) => {
  const [y, m, d] = String(s).split('T')[0].split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
};

const mondayOf = (d) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7; // 0=Mo..6=So
  c.setDate(c.getDate() - dow);
  c.setHours(0, 0, 0, 0);
  return c;
};

const inSameDayIso = (lhsIso, rhsIso) => toISO(fromIsoLocal(lhsIso)) === toISO(fromIsoLocal(rhsIso));

// ---------- API: Dashboard-Init ----------
export const getHomeInit = async () => {
  try {
    if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
    const headers = await authHeaders();
    const url = joinUrl(BASE_URL, PATHS.init);
    return await http(url, { method: 'GET', headers });
  } catch (err) {
    console.error('Error fetching home init:', err);
    return null;
  }
};

// ---------- API: Step Logs ----------
export const listUserStepLogs = async (userId) => {
  if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
  if (!userId && userId !== 0) throw new Error('userId required');

  const headers = await authHeaders();
  const base = joinUrl(BASE_URL, PATHS.stepLogs);
  const url = joinUrl(base, `user/${encodeURIComponent(String(userId))}`);

  return await http(url, { method: 'GET', headers });
};

// Hole eine bestimmte Woche (Mo..So) für einen User, clientseitig gefiltert
export const getWeekSteps = async (userId, weekStartISO) => {
  if (!userId && userId !== 0) throw new Error('userId required');
  if (!weekStartISO) throw new Error('weekStartISO required');

  const all = await listUserStepLogs(userId); // Array von StepLogResponse
  const weekStart = fromIsoLocal(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const withinWeek = (dateStr) => {
    const d = fromIsoLocal(dateStr);
    return d >= weekStart && d <= weekEnd;
  };

  // Mappe auf ein Format, das parseStepsThisWeek versteht
  const asObjects = (all ?? [])
    .filter((x) => x?.date && withinWeek(x.date))
    .map((x) => ({
      date: toISO(fromIsoLocal(x.date)),
      dayOfWeek: fromIsoLocal(x.date).toLocaleDateString('en-US', { weekday: 'long' }), // Tuesday, ...
      numberOfSteps:
        Number.isFinite(+x?.numberOfSteps) ? +x.numberOfSteps :
        Number.isFinite(+x?.steps) ? +x.steps : 0,
      step_log_id: x?.id, // nützlich fürs Update
    }));

  return asObjects;
};

// Upsert: existiert ein Log für dateISO → update, sonst create
export const upsertStepsForDate = async (userId, dateISO, absoluteSteps) => {
  if (!BASE_URL) throw new Error('Missing BASE_URL in expo constants');
  if (!userId && userId !== 0) throw new Error('userId required');
  if (!dateISO) throw new Error('dateISO required');

  const headers = await authHeaders();
  const base = joinUrl(BASE_URL, PATHS.stepLogs);

  // 1) existierendes StepLog für das Datum finden
  const all = await listUserStepLogs(userId);
  const existing = (all ?? []).find((log) => log?.date && inSameDayIso(log.date, dateISO));

  if (existing?.id != null) {
    const id = String(existing.id);
    // User-Update: PUT /?step_log_id=<id> mit StepLogUpdate
    // Wir schicken numberOfSteps (dein Response nutzt das Feld)
    const url = `${base}?step_log_id=${encodeURIComponent(id)}`;
    const body = JSON.stringify({ numberOfSteps: Number(absoluteSteps) });

    return await http(url, { method: 'PUT', headers, body });
  } else {
    // Create: POST / mit StepLogCreate
    // Wir schicken { date, numberOfSteps }
    const url = base;
    const body = JSON.stringify({ date: dateISO, numberOfSteps: Number(absoluteSteps) });

    return await http(url, { method: 'POST', headers, body });
  }
};
