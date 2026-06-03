// file: services/api.js

import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, refreshAccessToken } from '../lib/auth';

const API_BASE_URL = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');

// --- Refresh queue / concurrency control ---
let isRefreshing = false;
let refreshPromise = null; // Promise that resolves when refresh finished

const waitForRefresh = async () => {
  if (!isRefreshing) return;
  try {
    await refreshPromise;
  } catch {
    // swallow: caller will handle missing token / 401 again
  }
};

// --- Utility: join path to base ---
const buildUrl = (path) => {
  if (!path) throw new Error('Path is required');
  const p = String(path).replace(/^\/+/, '');
  return `${API_BASE_URL}/${p}`;
};

// --- Utility: safe json parse ---
const tryParseJson = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
};

// --- Debug helpers ---
const safeBodyPreview = (body) => {
  if (!body) return '';
  if (typeof body === 'string') return body.length > 300 ? body.slice(0, 300) + '…' : body;
  if (body instanceof FormData) return '[FormData]';
  try {
    const s = JSON.stringify(body);
    return s.length > 300 ? s.slice(0, 300) + '…' : s;
  } catch {
    return '[Unserializable body]';
  }
};

const logReq = (url, options) => {
  const method = (options?.method ?? 'GET').toUpperCase();
  const auth = options?.headers?.Authorization ? 'yes' : 'no';
  console.log(`➡️ [API] ${method} ${url} (auth=${auth}) body=${safeBodyPreview(options?.body)}`);
};

const logRes = (url, res) => {
  console.log(`⬅️ [API] ${res.status} ${res.statusText || ''} ${url}`);
};

const isUnauthorizedStatus = (status) => Number(status) === 401;
const isAbortError = (err) => err?.name === 'AbortError';

// --- Core fetch with auth and automatic refresh/retry ---
const authedFetch = async (path, options = {}, retry = true) => {
  if (!API_BASE_URL) throw new Error('Missing API_BASE_URL (expo constants)');

  const url = path.startsWith('http') ? path : buildUrl(path);

  const preserveAuthOnRefreshFailure = Boolean(options?.preserveAuthOnRefreshFailure);

  const requestOptions = { ...options };
  requestOptions.headers = requestOptions.headers ? { ...requestOptions.headers } : {};
  delete requestOptions.preserveAuthOnRefreshFailure;

  // Always load the latest token from storage
  let token = await getAccessToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.payload = { detail: 'Missing access token' };
    console.warn('🟠 [API] missing access token; skipping request:', url);
    throw err;
  }
  requestOptions.headers.Authorization = `Bearer ${token}`;

  // Default headers
  if (!requestOptions.headers['Content-Type'] && !(requestOptions.body instanceof FormData)) {
    requestOptions.headers['Content-Type'] = 'application/json';
  }
  if (!requestOptions.headers.Accept) {
    requestOptions.headers.Accept = 'application/json';
  }

  // Always explicitly follow redirects (default is 'follow', but log clarity helps)
  if (!requestOptions.redirect) requestOptions.redirect = 'follow';

  // ---- REQUEST LOG ----
  logReq(url, requestOptions);

  let res;
  try {
    res = await fetch(url, requestOptions);
  } catch (fetchErr) {
    if (isAbortError(fetchErr)) {
      console.warn('🟡 [API] request aborted:', url);
    } else {
      console.error('❌ [API] fetch() threw (network/SSL/etc):', fetchErr, 'URL:', url);
    }
    throw fetchErr;
  }

  // ---- RESPONSE LOG ----
  logRes(url, res);

  // If 401 and retry allowed => try refresh (single concurrent refresh)
  if (res.status === 401 && retry) {
    const latestAccessToken = await getAccessToken();
    const latestRefreshToken = await getRefreshToken();

    // User likely logged out while request was in-flight: do not refresh.
    if (!latestAccessToken || !latestRefreshToken) {
      const payload = await tryParseJson(res);
      const err = new Error('Unauthorized');
      err.status = 401;
      err.payload = payload;
      console.warn('🟠 [API] 401 after logout/token-clear; skipping refresh');
      throw err;
    }

    console.warn('🟠 [API] 401 received, attempting token refresh…');

    if (isRefreshing) {
      console.warn('🟠 [API] refresh already in progress; waiting…');
      await waitForRefresh();
    } else {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const newToken = await refreshAccessToken(API_BASE_URL);
          if (!newToken) {
            // Never auto-logout on refresh failure. Keep auth state stable and
            // let the caller decide how to recover (retry, show warning, manual logout).
            throw new Error('Unable to refresh token');
          }
          console.warn('🟢 [API] token refresh success');
          return newToken;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();

      try {
        await refreshPromise;
      } catch (err) {
        console.warn('🟠 [API] token refresh failed:', err);
      }
    }

    const newToken = await getAccessToken();
    if (!newToken) {
      const payload = await tryParseJson(res);
      const err = new Error('Unauthorized');
      err.status = 401;
      err.payload = payload;
      console.warn('🟠 [API] retry aborted: no new token', payload);
      throw err;
    }

    // Retry the original request exactly once with new token
    const retryOptions = {
      ...requestOptions,
      headers: { ...requestOptions.headers, Authorization: `Bearer ${newToken}` },
    };

    console.warn('🟡 [API] retrying request once after refresh…');
    logReq(url, retryOptions);

    let retryRes;
    try {
      retryRes = await fetch(url, retryOptions);
    } catch (fetchErr2) {
      if (isAbortError(fetchErr2)) {
        console.warn('🟡 [API] retry request aborted:', url);
      } else {
        console.error('❌ [API] retry fetch() threw:', fetchErr2, 'URL:', url);
      }
      throw fetchErr2;
    }

    logRes(url, retryRes);

    const payload = await tryParseJson(retryRes);
    if (!retryRes.ok) {
      const detail = payload?.detail;
      const detailStr = Array.isArray(detail)
        ? JSON.stringify(detail)
        : typeof detail === 'string' ? detail : null;
      const err = new Error(payload?.message ?? detailStr ?? `HTTP ${retryRes.status}`);
      err.status = retryRes.status;
      err.payload = payload;
      if (isUnauthorizedStatus(err.status)) {
        console.warn('🟠 [API] retry unauthorized:', err.status, payload);
      } else {
        console.error('🔴 [API] retry failed:', err.status, JSON.stringify(payload));
      }
      throw err;
    }
    return payload;
  }

  // Normal (non-401) flow
  const payload = await tryParseJson(res);

  if (!res.ok) {
    const detail = payload?.detail;
    const detailStr = Array.isArray(detail)
      ? JSON.stringify(detail)
      : typeof detail === 'string' ? detail : null;
    const err = new Error(payload?.message ?? detailStr ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    if (isUnauthorizedStatus(err.status)) {
      console.warn('🟠 [API] unauthorized:', err.status, payload);
    } else if (err.status === 404) {
      console.warn('🟡 [API] not found:', err.status, JSON.stringify(payload));
    } else {
      console.error('🔴 [API] request failed:', err.status, JSON.stringify(payload));
    }
    throw err;
  }

  return payload;
};

// --- Public API helpers ---
export const apiGet = async (path, options = {}) =>
  authedFetch(path, { ...options, method: 'GET' }, true);

export const apiPost = async (path, bodyObj = {}, options = {}) => {
  const body = bodyObj instanceof FormData ? bodyObj : JSON.stringify(bodyObj);
  const headers = bodyObj instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  return authedFetch(path, { ...options, method: 'POST', headers, body }, true);
};

export const apiPut = async (path, bodyObj = {}, options = {}) => {
  const body = bodyObj instanceof FormData ? bodyObj : JSON.stringify(bodyObj);
  const headers = bodyObj instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  return authedFetch(path, { ...options, method: 'PUT', headers, body }, true);
};

export const apiDelete = async (path) => authedFetch(path, { method: 'DELETE' }, true);

// Optional helper: call non-auth endpoint (public)
export const publicGet = async (path) => {
  if (!API_BASE_URL) throw new Error('Missing API_BASE_URL (expo constants)');
  const url = path.startsWith('http') ? path : buildUrl(path);

  console.log(`➡️ [API] GET (public) ${url}`);

  let res;
  try {
    res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  } catch (fetchErr) {
    if (isAbortError(fetchErr)) {
      console.warn('🟡 [API] public request aborted:', url);
    } else {
      console.error('❌ [API] public fetch() threw:', fetchErr, 'URL:', url);
    }
    throw fetchErr;
  }

  logRes(url, res);

  const payload = await tryParseJson(res);
  if (!res.ok) {
    const pretty =
      payload == null
        ? `HTTP ${res.status}`
        : typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);

    const detail =
      payload?.message ??
      (typeof payload?.detail === 'string'
        ? payload.detail
        : payload?.detail
          ? JSON.stringify(payload.detail)
          : null);

    const err = new Error(detail ?? pretty ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    console.error('🔴 [API] request failed:', err.status, payload);
    throw err;

  }
  return payload;
};

// Optional helper: call non-auth endpoint with POST (public)
export const publicPost = async (path, bodyObj = {}) => {
  if (!API_BASE_URL) throw new Error('Missing API_BASE_URL (expo constants)');
  const url = path.startsWith('http') ? path : buildUrl(path);

  const body = bodyObj instanceof FormData ? bodyObj : JSON.stringify(bodyObj);
  const headers = bodyObj instanceof FormData
    ? { Accept: 'application/json' }
    : { 'Content-Type': 'application/json', Accept: 'application/json' };

  console.log(`➡️ [API] POST (public) ${url}`);

  let res;
  try {
    res = await fetch(url, { method: 'POST', headers, body });
  } catch (fetchErr) {
    if (isAbortError(fetchErr)) {
      console.warn('🟡 [API] public POST aborted:', url);
    } else {
      console.error('❌ [API] public POST threw:', fetchErr, 'URL:', url);
    }
    throw fetchErr;
  }

  logRes(url, res);

  const payload = await tryParseJson(res);
  if (!res.ok) {
    const pretty =
      payload == null
        ? `HTTP ${res.status}`
        : typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);
    const detail =
      payload?.message ??
      (typeof payload?.detail === 'string'
        ? payload.detail
        : payload?.detail
          ? JSON.stringify(payload.detail)
          : null);
    const err = new Error(detail ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    console.error('🔴 [API] public POST failed:', err.status, payload);
    throw err;
  }
  return payload;
};
