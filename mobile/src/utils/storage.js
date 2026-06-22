import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';

// SecureStore for sensitive data (tokens), falls back gracefully
async function secureSet(key, value) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore not available on web/emulator in some envs — noop
  }
}

async function secureGet(key) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureDel(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // noop
  }
}

export const storage = {
  async saveToken(token) {
    await secureSet(STORAGE_KEYS.TOKEN, token);
  },

  async getToken() {
    return await secureGet(STORAGE_KEYS.TOKEN);
  },

  async saveRefreshToken(token) {
    await secureSet(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken() {
    return await secureGet(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async saveUser(user) {
    await secureSet(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser() {
    const raw = await secureGet(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async clearAuth() {
    await secureDel(STORAGE_KEYS.TOKEN);
    await secureDel(STORAGE_KEYS.REFRESH_TOKEN);
    await secureDel(STORAGE_KEYS.USER);
  },

  // Generic key-value helpers (for non-sensitive prefs)
  async set(key, value) {
    await secureSet(key, value);
  },

  async get(key) {
    return await secureGet(key);
  },
};
