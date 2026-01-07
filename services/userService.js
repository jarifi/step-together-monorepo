// file: services/userService.js
import { apiDelete, apiGet, apiPost, apiPut } from './api';

// ---------------------------------------------------------------------------
// GET USERS (with skip/limit + dummy avatars)
// ---------------------------------------------------------------------------
export const getUsers = async (skip = 0, limit = 10) => {
  try {
    const users = await apiGet(`/users/?skip=${skip}&limit=${limit}`);
    // Add dummy avatars
    return users.map((u, i) => ({
      ...u,
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
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
    // Add dummy avatars
    return users.map((u, i) => ({
      ...u,
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
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