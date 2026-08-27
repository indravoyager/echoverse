import { GoogleGenAI } from '@google/genai';
import { BaseAIProvider } from './BaseAIProvider';

/**
 * Google Gemini Provider Strategy (Single Responsibility Principle)
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(apiConfig = {}) {
    super();
    this.apiConfig = apiConfig;
  }

  setApiConfig(config) {
    this.apiConfig = { ...this.apiConfig, ...config };
  }

  async generateContent(model, contents, config) {
    const useCustomKey = Boolean(this.apiConfig.useCustom && this.apiConfig.customKey);
    const isDev = import.meta.env.DEV;

    if (useCustomKey || isDev) {
      const apiKey = useCustomKey
        ? this.apiConfig.customKey
        : import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please configure it in settings or .env file.');
      }
      const ai = new GoogleGenAI({ apiKey });
      return await ai.models.generateContent({ model, contents, config });
    } else {
      let _c = undefined;
      try {
        if (config) _c = btoa(encodeURIComponent(JSON.stringify(config)));
      } catch {
        console.warn('[GeminiProvider] Failed to encode proxy config payload.');
      }

      const response = await fetch('/api/philia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, contents, _c })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
  }

  async testConnection(apiKey, modelName) {
    if (!apiKey) return { success: false, message: 'API Key is required.' };
    const model = modelName || 'gemini-3.1-flash-lite';
    const testClient = new GoogleGenAI({ apiKey });
    await testClient.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: 'reply ok' }] }]
    });
    return { success: true };
  }
}
