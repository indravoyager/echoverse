import { GLOBAL_THEMES } from '../../config/themes';

/**
 * ThemeService (Single Responsibility)
 * Manages application themes, CSS root variables, and dark mode state.
 */
export class ThemeService {
  static getThemeStyles(globalThemeId) {
    const validThemeId = typeof globalThemeId === 'string' ? globalThemeId : 'slate';
    const isCustomHex = validThemeId.startsWith('#');
    const themeConfig = GLOBAL_THEMES[validThemeId];

    return {
      '--color-brand-magenta': isCustomHex ? validThemeId : themeConfig?.primary || '#94a3b8',
      '--color-brand-purple': isCustomHex ? validThemeId : themeConfig?.secondary || '#475569'
    };
  }

  static applyDarkMode(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      console.warn('[ThemeService] Unable to save theme to localStorage.');
    }
  }

  static getInitialDarkMode() {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  }
}
