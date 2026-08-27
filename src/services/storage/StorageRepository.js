import localforage from 'localforage';

/**
 * Centralized Storage Keys definitions.
 */
export const STORAGE_KEYS = {
  CHATS_PREFIX: 'chat_',
  USER_NAME: 'user_name',
  USER_AVATAR: 'user_avatar',
  UNREAD_COUNTS: 'unread_counts',
  AFFINITY_LEVELS: 'affinity_levels',
  MEMORIES: 'memories',
  MOODS: 'moods',
  PINNED_PERSONAS: 'pinned_personas',
  ARCHIVED_PERSONAS: 'archived_personas',
  CUSTOM_TAGS: 'custom_tags',
  API_CONFIG: 'api_config',
  GLOBAL_THEME: 'global_theme',
  CUSTOM_PERSONAS: 'custom_personas',
  BG_EFFECTS: 'bg_effects_enabled',
  TOOL_VISIBILITY: 'tool_visibility',
  PERSONA_ACCESS: 'persona_access_enabled',
  CHATWORLD_MESSAGES: 'chatworld_messages'
};

/**
 * StorageRepository Class (Single Responsibility Principle & High Cohesion)
 * Encapsulates all persistent storage interaction via LocalForage with robust fallback handling.
 */
export class StorageRepository {
  constructor(name = 'EchoAturaiDB', storeName = 'chats') {
    this.store = localforage.createInstance({ name, storeName });
  }

  async getItem(key, fallback = null) {
    try {
      const value = await this.store.getItem(key);
      return value !== null && value !== undefined ? value : fallback;
    } catch (err) {
      console.error(`[StorageRepository] Error loading key "${key}":`, err);
      return fallback;
    }
  }

  async setItem(key, value) {
    try {
      await this.store.setItem(key, value);
    } catch (err) {
      console.error(`[StorageRepository] Error saving key "${key}":`, err);
    }
  }

  async removeItem(key) {
    try {
      await this.store.removeItem(key);
    } catch (err) {
      console.error(`[StorageRepository] Error removing key "${key}":`, err);
    }
  }

  async clear() {
    try {
      await this.store.clear();
    } catch (err) {
      console.error('[StorageRepository] Error clearing store:', err);
    }
  }

  async getKeys() {
    try {
      return await this.store.keys();
    } catch (err) {
      console.error('[StorageRepository] Error getting keys:', err);
      return [];
    }
  }
}
