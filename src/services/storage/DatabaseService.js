import { StorageRepository, STORAGE_KEYS } from './StorageRepository';

/**
 * DatabaseService (Centralized Control & High Cohesion)
 * Handles domain-level persistence workflows for personas, chats, settings, and user profiles.
 */
export class DatabaseService {
  constructor(repository = new StorageRepository()) {
    this.repo = repository;
  }

  // Chats
  async saveChats(personaId, messages) {
    return this.repo.setItem(`${STORAGE_KEYS.CHATS_PREFIX}${personaId}`, messages);
  }

  async loadChats(personaId) {
    return this.repo.getItem(`${STORAGE_KEYS.CHATS_PREFIX}${personaId}`, null);
  }

  async clearChats(personaId) {
    return this.repo.removeItem(`${STORAGE_KEYS.CHATS_PREFIX}${personaId}`);
  }

  async clearAllUnpinnedChats() {
    try {
      const pinnedPersonas = (await this.loadPinnedPersonas()) || [];
      const keys = await this.repo.getKeys();
      const chatKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.CHATS_PREFIX));

      for (const key of chatKeys) {
        const personaId = key.replace(STORAGE_KEYS.CHATS_PREFIX, '');
        if (!pinnedPersonas.includes(personaId)) {
          await this.repo.removeItem(key);
        }
      }

      const currentToolVisibility = (await this.loadToolVisibility()) || {};
      const newToolVisibility = {};
      for (const toolId in currentToolVisibility) {
        if (pinnedPersonas.includes(toolId)) {
          newToolVisibility[toolId] = currentToolVisibility[toolId];
        }
      }
      await this.saveToolVisibility(newToolVisibility);
    } catch (err) {
      console.error('[DatabaseService] Failed to clear all chats:', err);
    }
  }

  async factoryReset() {
    try {
      await this.repo.clear();
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
    } catch (err) {
      console.error('[DatabaseService] Failed to factory reset:', err);
    }
  }

  // Profile & Settings
  saveUserName(name) { return this.repo.setItem(STORAGE_KEYS.USER_NAME, name); }
  loadUserName() { return this.repo.getItem(STORAGE_KEYS.USER_NAME, null); }

  saveUserAvatar(avatarDataUrl) { return this.repo.setItem(STORAGE_KEYS.USER_AVATAR, avatarDataUrl); }
  loadUserAvatar() { return this.repo.getItem(STORAGE_KEYS.USER_AVATAR, null); }

  saveUnreadCounts(counts) { return this.repo.setItem(STORAGE_KEYS.UNREAD_COUNTS, counts); }
  loadUnreadCounts() { return this.repo.getItem(STORAGE_KEYS.UNREAD_COUNTS, null); }

  saveAffinityLevels(levels) { return this.repo.setItem(STORAGE_KEYS.AFFINITY_LEVELS, levels); }
  loadAffinityLevels() { return this.repo.getItem(STORAGE_KEYS.AFFINITY_LEVELS, null); }

  saveMemories(memories) { return this.repo.setItem(STORAGE_KEYS.MEMORIES, memories); }
  loadMemories() { return this.repo.getItem(STORAGE_KEYS.MEMORIES, null); }

  saveMoods(moods) { return this.repo.setItem(STORAGE_KEYS.MOODS, moods); }
  loadMoods() { return this.repo.getItem(STORAGE_KEYS.MOODS, null); }

  savePinnedPersonas(pinned) { return this.repo.setItem(STORAGE_KEYS.PINNED_PERSONAS, pinned); }
  loadPinnedPersonas() { return this.repo.getItem(STORAGE_KEYS.PINNED_PERSONAS, null); }

  saveArchivedPersonas(archived) { return this.repo.setItem(STORAGE_KEYS.ARCHIVED_PERSONAS, archived); }
  loadArchivedPersonas() { return this.repo.getItem(STORAGE_KEYS.ARCHIVED_PERSONAS, null); }

  saveCustomTags(tags) { return this.repo.setItem(STORAGE_KEYS.CUSTOM_TAGS, tags); }
  loadCustomTags() { return this.repo.getItem(STORAGE_KEYS.CUSTOM_TAGS, null); }

  saveApiConfig(config) { return this.repo.setItem(STORAGE_KEYS.API_CONFIG, config); }
  loadApiConfig() { return this.repo.getItem(STORAGE_KEYS.API_CONFIG, null); }

  saveGlobalTheme(themeId) { return this.repo.setItem(STORAGE_KEYS.GLOBAL_THEME, themeId); }
  loadGlobalTheme() { return this.repo.getItem(STORAGE_KEYS.GLOBAL_THEME, null); }

  saveCustomPersonas(personas) { return this.repo.setItem(STORAGE_KEYS.CUSTOM_PERSONAS, personas); }
  loadCustomPersonas() { return this.repo.getItem(STORAGE_KEYS.CUSTOM_PERSONAS, []); }

  saveBgEffects(enabled) { return this.repo.setItem(STORAGE_KEYS.BG_EFFECTS, enabled); }
  loadBgEffects() { return this.repo.getItem(STORAGE_KEYS.BG_EFFECTS, false); }

  saveToolVisibility(visibility) { return this.repo.setItem(STORAGE_KEYS.TOOL_VISIBILITY, visibility); }
  loadToolVisibility() { return this.repo.getItem(STORAGE_KEYS.TOOL_VISIBILITY, null); }

  savePersonaAccess(enabled) { return this.repo.setItem(STORAGE_KEYS.PERSONA_ACCESS, enabled); }
  loadPersonaAccess() { return this.repo.getItem(STORAGE_KEYS.PERSONA_ACCESS, true); }

  saveChatWorldMessages(messages) { return this.repo.setItem(STORAGE_KEYS.CHATWORLD_MESSAGES, messages); }
  loadChatWorldMessages() { return this.repo.getItem(STORAGE_KEYS.CHATWORLD_MESSAGES, []); }
}
