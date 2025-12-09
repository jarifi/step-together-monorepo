// file: services/api.js

import Constants from 'expo-constants';
import {
  getAccessToken,
  refreshAccessToken,
  removeTokens
} from '../lib/auth';

const API_BASE_URL = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');

// --- Refresh queue / concurrency control ---
let isRefreshing = false;
let refreshPromise = null; // Promise that resolves when refresh finished

const waitForRefresh = async () => {
  if (!isRefreshing) return;
  // wait for existing refreshPromise to settle
  try {
    await refreshPromise;
  } catch {
    // swallow: caller will handle missing token / 401 again
  }
};

// --- Utility: join path to base ---
const buildUrl = (path) => {
  if (!path) throw new Error('Path is required');
  // allow path with or without leading slash
  const p = String(path).replace(/^\/+/, '');
  return `${API_BASE_URL}/${p}`;
};

// --- Utility: safe json parse ---
const tryParseJson = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    // fallback: return raw text
    return text || null;
  }
};

// --- Core fetch with auth and automatic refresh/retry ---
const authedFetch = async (path, options = {}, retry = true) => {
  if (!API_BASE_URL) throw new Error('Missing API_BASE_URL (expo constants)');

  // Build URL
  const url = path.startsWith('http') ? path : buildUrl(path);

  // Ensure headers object
  options.headers = options.headers ? { ...options.headers } : {};

  // Always load the latest token from storage
  let token = await getAccessToken();

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  // Default headers
  if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
  }
  if (!options.headers.Accept) {
    options.headers.Accept = 'application/json';
  }

  const res = await fetch(url, options);

  // If 401 and retry allowed => try refresh (single concurrent refresh)
  if (res.status === 401 && retry) {
    // If there's already a refresh happening, wait for it
    if (isRefreshing) {
      await waitForRefresh();
    } else {
      // start refresh
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const newToken = await refreshAccessToken(API_BASE_URL);
          if (!newToken) {
            // Refresh failed -> clear stored tokens
            await removeTokens();
            throw new Error('Unable to refresh token');
          }
          return newToken;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
      try {
        await refreshPromise;
      } catch (err) {
        // refresh failed: rethrow below after cleanup
      }
    }

    // After refresh attempt, read token again
    const newToken = await getAccessToken();
    if (!newToken) {
      // nothing we can do — credentials invalid
      const payload = await tryParseJson(res);
      const err = new Error('Unauthorized');
      err.status = 401;
      err.payload = payload;
      throw err;
    }

    // Retry the original request exactly once with new token
    options.headers = { ...options.headers, Authorization: `Bearer ${newToken}` };
    const retryRes = await fetch(url, options);

    // Parse payload
    const payload = await tryParseJson(retryRes);
    if (!retryRes.ok) {
      const err = new Error(
        (payload && (payload.message || payload.detail)) || `HTTP ${retryRes.status}`
      );
      err.status = retryRes.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  // Normal (non-401) flow
  const payload = await tryParseJson(res);

  if (!res.ok) {
    // If server responded non-OK, create error with status + payload
    const err = new Error(
      (payload && (payload.message || payload.detail)) ||
        (Array.isArray(payload?.detail) ? JSON.stringify(payload.detail) : `HTTP ${res.status}`)
    );
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
};

// --- Public API helpers ---

export const apiGet = async (path) => {
  return authedFetch(path, { method: 'GET' }, true);
};

export const apiPost = async (path, bodyObj = {}) => {
  const body = bodyObj instanceof FormData ? bodyObj : JSON.stringify(bodyObj);
  const headers = bodyObj instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  return authedFetch(path, { method: 'POST', headers, body }, true);
};

export const apiPut = async (path, bodyObj = {}) => {
  const body = bodyObj instanceof FormData ? bodyObj : JSON.stringify(bodyObj);
  const headers = bodyObj instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  return authedFetch(path, { method: 'PUT', headers, body }, true);
};

export const apiDelete = async (path) => {
  return authedFetch(path, { method: 'DELETE' }, true);
};

// Optional helper: call non-auth endpoint (public)
export const publicGet = async (path) => {
  if (!API_BASE_URL) throw new Error('Missing API_BASE_URL (expo constants)');
  const url = path.startsWith('http') ? path : buildUrl(path);
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  const payload = await tryParseJson(res);
  if (!res.ok) {
    const err = new Error((payload && payload.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
};
