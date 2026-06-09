// file: services/userService.js
import Constants from 'expo-constants';
import { apiDelete, apiGet, apiPost, apiPut, publicPost } from './api';

const API_BASE_URL = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const tryParseUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const normalizeAbsoluteMediaUrl = (rawAbsoluteUrl) => {
  const incoming = tryParseUrl(rawAbsoluteUrl);
  const apiOriginUrl = tryParseUrl(API_ORIGIN);
  if (!incoming || !apiOriginUrl) return rawAbsoluteUrl;

  // If backend generated http:// for the same host while API is https://,
  // enforce https so Android release builds can load the image.
  if (
    incoming.protocol === 'http:' &&
    apiOriginUrl.protocol === 'https:' &&
    incoming.hostname === apiOriginUrl.hostname
  ) {
    incoming.protocol = 'https:';
    if (incoming.port === '80') incoming.port = '';
    return incoming.toString();
  }

  // If backend returned localhost/127.0.0.1 in an absolute media URL,
  // rewrite to the configured API host so devices can actually resolve it.
  if (/^(localhost|127\.0\.0\.1)$/i.test(incoming.hostname)) {
    incoming.protocol = apiOriginUrl.protocol;
    incoming.hostname = apiOriginUrl.hostname;
    incoming.port = apiOriginUrl.port;
    return incoming.toString();
  }

  return rawAbsoluteUrl;
};

export const makeAbsoluteMediaUrl = (maybePath) => {
  if (!maybePath) return null;
  const s = String(maybePath).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return normalizeAbsoluteMediaUrl(s);
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
};

export const getDisplayAvatarUri = (userLike) => {
  if (!userLike) return null;

  const raw =
    userLike?.avatarUrl ??
    userLike?.avatar_url ??
    userLike?.profilePicture ??
    userLike?.profile_picture ??
    userLike?.profile_picture_url ??
    userLike?.profilePictureUrl ??
    userLike?.avatar ??
    userLike?.picture ??
    userLike?.pictureUrl ??
    userLike?.image ??
    userLike?.imageUrl ??
    userLike?.photo ??
    userLike?.photoUrl ??
    userLike?.user?.avatarUrl ??
    userLike?.user?.avatar_url ??
    userLike?.user?.profilePicture ??
    userLike?.user?.profile_picture ??
    userLike?.user?.profile_picture_url ??
    userLike?.user?.profilePictureUrl ??
    null;

  const s = raw == null ? '' : String(raw).trim();
  if (!s) return null;

  return makeAbsoluteMediaUrl(s) ?? s;
};

const normalizeUser = (u) => {
  const verified =
    u?.isVerified ??
    u?.is_verified ??
    u?.verified ??
    false;

  return {
    ...u,
    isVerified: verified,
    is_verified: verified,
    verified,
    avatar: makeAbsoluteMediaUrl(
      u?.avatarUrl ?? u?.avatar_url ?? u?.profile_picture ?? u?.profilePicture ?? u?.profile_picture_url ?? null
    ),
  };
};

const buildUserQuery = ({ skip = 0, limit = 10, isVerified = null, query = '' } = {}) => {
  const params = new URLSearchParams();

  params.append('skip', String(skip));
  params.append('limit', String(limit));

  if (isVerified !== null && isVerified !== undefined) {
    params.append('is_verified', String(isVerified));
  }

  if (query.trim()) {
    params.append('q', query.trim());
  }

  return params.toString();
};

// ------------------------------
// UPLOAD profile picture
// ------------------------------
export const uploadMyProfilePicture = async (imageInput) => {
  const asset = typeof imageInput === 'string' ? { uri: imageInput } : (imageInput ?? {});
  const imageUri = String(asset?.uri ?? '').trim();
  if (!imageUri) throw new Error('Missing image URI');

  const ext = (() => {
    const m = imageUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return m?.[1]?.toLowerCase() ?? 'jpg';
  })();

  const mimeType =
    String(asset?.mimeType || '').trim() ||
    (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

  const filename =
    String(asset?.fileName || '').trim() ||
    `profile_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

  // Strategy 1: URI file part (works for most iOS/Android builds)
  const fdFromUri = new FormData();
  fdFromUri.append('file', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  });

  try {
    return await apiPost('/users/me/profile-picture', fdFromUri);
  } catch (err) {
    const msg = String(err?.message ?? '');
    const isNetworkFailure = /Network request failed/i.test(msg);
    if (!isNetworkFailure) throw err;
    console.warn('🟠 [UPLOAD] URI multipart failed, retrying with blob fallback...');
  }

  // Strategy 2: Blob part (fallback for some Android release multipart edge cases)
  const fileResp = await fetch(imageUri);
  const fileBlob = await fileResp.blob();
  const fdFromBlob = new FormData();
  fdFromBlob.append('file', fileBlob, filename);
  return await apiPost('/users/me/profile-picture', fdFromBlob);
};

// ---------------------------------------------------------------------------
// GET CURRENT USER (/users/me)
// ---------------------------------------------------------------------------
export const getMe = async () => {
  try {
    const user = await apiGet('/users/me');
    return user ? normalizeUser(user) : null;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// GET USER BY ID
// ---------------------------------------------------------------------------
export const getUserById = async (id) => {
  if (!id) return null;
  try {
    const user = await apiGet(`/users/${id}`);
    return user ? normalizeUser(user) : null;
  } catch (err) {
    console.error('Error fetching user by id:', err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// GET USERS (with skip/limit + verified filter)
// ---------------------------------------------------------------------------
export const getUsers = async (skip = 0, limit = 10, isVerified = null) => {
  try {
    const qs = buildUserQuery({ skip, limit, isVerified });
    const users = await apiGet(`/users/?${qs}`);
    return Array.isArray(users) ? users.map(normalizeUser) : [];
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// SEARCH USERS (with paging + verified filter)
// ---------------------------------------------------------------------------
export const searchUsers = async (query, skip = 0, limit = 10, isVerified = null) => {
  try {
    const qs = buildUserQuery({ skip, limit, isVerified, query });
    const users = await apiGet(`/users/search?${qs}`);
    return Array.isArray(users) ? users.map(normalizeUser) : [];
  } catch (err) {
    console.error('Error searching users:', err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// UPDATE USER
// ---------------------------------------------------------------------------
export const updateUser = async (id, data) => {
  try {
    return await apiPut(`/users/${id}`, data);
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// REGISTER USER
// ---------------------------------------------------------------------------
export const registerUser = async (userData) => {
  try {
    return await publicPost(`/auth/register`, userData);
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// ACCEPT PRIVACY POLICY (for admin-created users on first login)
// ---------------------------------------------------------------------------
export const acceptPrivacyPolicy = async (email, password) => {
  try {
    return await publicPost('/auth/accept-privacy-policy', { email, password });
  } catch (err) {
    console.error('Error accepting privacy policy:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// CREATE USER
// ---------------------------------------------------------------------------
export const createUser = async (userData) => {
  try {
    return await apiPost(`/users/`, userData);
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// DELETE USER
// ---------------------------------------------------------------------------
export const deleteUser = async (id) => {
  try {
    return await apiDelete(`/users/${id}`);
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// VERIFY USER
// ---------------------------------------------------------------------------
export const verifyUser = async (id) => {
  try {
    return await apiPost(`/users/${id}/verify`);
  } catch (err) {
    console.error('Error verifying user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// DELETE OWN ACCOUNT
// ---------------------------------------------------------------------------
export const deleteOwnAccount = async (password) => {
  try {
    return await apiPost('/users/me/delete', { password });
  } catch (err) {
    console.error('Error deleting own account:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// UNLOCK USER (admin)
// ---------------------------------------------------------------------------
export const unlockUser = async (id) => {
  try {
    return await apiPost(`/auth/unlock/${id}`);
  } catch (err) {
    console.error('Error unlocking user:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
export const changePassword = async (oldPassword, newPassword) => {
  try {
    return await apiPost('/auth/change_password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  } catch (err) {
    console.error('Error changing password:', err);
    throw err;
  }
};