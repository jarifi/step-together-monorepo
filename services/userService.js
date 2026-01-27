// file: services/userService.js
import Constants from 'expo-constants';
import { apiDelete, apiGet, apiPost, apiPut } from './api';

const API_BASE_URL = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const makeAbsoluteMediaUrl = (maybePath) => {
  if (!maybePath) return null;
  const s = String(maybePath).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
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

// ------------------------------
// UPLOAD profile picture
// ------------------------------
export const uploadMyProfilePicture = async (imageUri) => {
  const formData = new FormData();
  const filename = `profile_${Date.now()}.jpg`;

  if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
    const r = await fetch(imageUri);
    const blob = await r.blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    });
  }

  return await apiPost('/users/me/profile-picture', formData);
};


// ---------------------------------------------------------------------------
// GET USERS (with skip/limit)
// ---------------------------------------------------------------------------
export const getUsers = async (skip = 0, limit = 10) => {
  try {
    const users = await apiGet(`/users/?skip=${skip}&limit=${limit}`);
    return users.map((u) => ({
      ...u,
      avatar: makeAbsoluteMediaUrl(u.avatarUrl ?? u.avatar_url ?? null),
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// SEARCH USERS (by name, email, or ID)
// ---------------------------------------------------------------------------
export const searchUsers = async (query) => {
  try {
    const users = await apiGet(`/users/search?q=${encodeURIComponent(query)}`);
    return users.map((u) => ({
      ...u,
      avatar: makeAbsoluteMediaUrl(u.avatarUrl ?? u.avatar_url ?? null),
    }));
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