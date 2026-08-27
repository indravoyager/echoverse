import { StorageRepository, STORAGE_KEYS } from '../services/storage/StorageRepository';
import { DatabaseService } from '../services/storage/DatabaseService';

// Re-export core classes & constants
export { StorageRepository, STORAGE_KEYS, DatabaseService };

// Singleton Instance
export const dbService = new DatabaseService();
export const storageRepo = dbService.repo;

// Backwards-compatible Helper Export Wrappers
export const saveChats = (personaId, messages) => dbService.saveChats(personaId, messages);
export const loadChats = (personaId) => dbService.loadChats(personaId);
export const clearChats = (personaId) => dbService.clearChats(personaId);
export const clearAllChats = () => dbService.clearAllUnpinnedChats();
export const factoryReset = () => dbService.factoryReset();

export const saveUserName = (name) => dbService.saveUserName(name);
export const loadUserName = () => dbService.loadUserName();

export const saveUnreadCounts = (counts) => dbService.saveUnreadCounts(counts);
export const loadUnreadCounts = () => dbService.loadUnreadCounts();

export const saveAffinityLevels = (levels) => dbService.saveAffinityLevels(levels);
export const loadAffinityLevels = () => dbService.loadAffinityLevels();

export const saveMemories = (memories) => dbService.saveMemories(memories);
export const loadMemories = () => dbService.loadMemories();

export const saveUserAvatar = (avatarDataUrl) => dbService.saveUserAvatar(avatarDataUrl);
export const loadUserAvatar = () => dbService.loadUserAvatar();

export const saveMoods = (moods) => dbService.saveMoods(moods);
export const loadMoods = () => dbService.loadMoods();

export const savePinnedPersonas = (pinned) => dbService.savePinnedPersonas(pinned);
export const loadPinnedPersonas = () => dbService.loadPinnedPersonas();

export const saveArchivedPersonas = (archived) => dbService.saveArchivedPersonas(archived);
export const loadArchivedPersonas = () => dbService.loadArchivedPersonas();

export const saveCustomTags = (tags) => dbService.saveCustomTags(tags);
export const loadCustomTags = () => dbService.loadCustomTags();

export const saveApiConfig = (config) => dbService.saveApiConfig(config);
export const loadApiConfig = () => dbService.loadApiConfig();

export const saveGlobalTheme = (themeId) => dbService.saveGlobalTheme(themeId);
export const loadGlobalTheme = () => dbService.loadGlobalTheme();

export const saveCustomPersonas = (personas) => dbService.saveCustomPersonas(personas);
export const loadCustomPersonas = () => dbService.loadCustomPersonas();

export const saveBgEffects = (enabled) => dbService.saveBgEffects(enabled);
export const loadBgEffects = () => dbService.loadBgEffects();

export const saveToolVisibility = (visibility) => dbService.saveToolVisibility(visibility);
export const loadToolVisibility = () => dbService.loadToolVisibility();

export const savePersonaAccess = (enabled) => dbService.savePersonaAccess(enabled);
export const loadPersonaAccess = () => dbService.loadPersonaAccess();

export const saveChatWorldMessages = (messages) => dbService.saveChatWorldMessages(messages);
export const loadChatWorldMessages = () => dbService.loadChatWorldMessages();
