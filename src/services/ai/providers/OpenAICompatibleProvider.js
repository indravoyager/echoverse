import { BaseAIProvider } from './BaseAIProvider';

/**
 * OpenAI, Groq & Custom Compatible Provider Strategy (Single Responsibility Principle)
 */
export class OpenAICompatibleProvider extends BaseAIProvider {
  constructor(providerName = 'openai', apiConfig = {}) {
    super();
    this.providerName = providerName;
    this.apiConfig = apiConfig;
  }

  setApiConfig(config) {
    this.apiConfig = config;
  }

  getBaseUrl(customBaseUrlOverride) {
    const rawUrl = customBaseUrlOverride || this.apiConfig?.baseUrl || this.apiConfig?.customBaseUrl;
    if (this.providerName === 'groq') {
      return 'https://api.groq.com/openai/v1/chat/completions';
    }
    if (this.providerName === 'custom' || rawUrl) {
      if (!rawUrl) return 'https://openrouter.ai/api/v1/chat/completions';
      let url = rawUrl.trim();
      if (url.endsWith('/')) url = url.slice(0, -1);
      if (!url.endsWith('/chat/completions')) {
        url = `${url}/chat/completions`;
      }
      return url;
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  formatContents(contents, systemInstruction, model = '') {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    for (const c of contents) {
      const role = c.role === 'model' ? 'assistant' : 'user';
      const content = [];

      for (const part of c.parts) {
        if (part.text) {
          content.push({ type: 'text', text: part.text });
        }
        if (part.inlineData) {
          if (part.inlineData.mimeType && !part.inlineData.mimeType.startsWith('image/')) {
            throw new Error(
              'Dokumen/PDF tidak didukung untuk API pihak ketiga (OpenAI/Groq). Silakan gunakan provider Google Gemini default.'
            );
          }
          if (
            this.providerName === 'groq' &&
            !model.toLowerCase().includes('vision') &&
            !model.toLowerCase().includes('llava')
          ) {
            throw new Error(
              'Model Groq yang dipilih tidak mendukung berkas/gambar. Gunakan model vision (seperti llama-3.2-11b-vision) atau gunakan Google Gemini.'
            );
          }
          content.push({
            type: 'image_url',
            image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
          });
        }
      }

      if (content.length === 1 && content[0].type === 'text') {
        messages.push({ role, content: content[0].text });
      } else {
        messages.push({ role, content });
      }
    }

    return messages;
  }

  async generateContent(model, contents, config, apiKey) {
    const baseUrl = this.getBaseUrl(config?.baseUrl || this.apiConfig?.baseUrl);
    const messages = this.formatContents(contents, config?.systemInstruction, model);

    const payload = {
      model: model,
      messages: messages,
      temperature: config?.temperature !== undefined ? config.temperature : 0.7
    };

    if (config?.responseMimeType === 'application/json' && this.providerName === 'openai') {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      candidates: [{ groundingMetadata: null }]
    };
  }

  async testConnection(apiKey, modelName, baseUrlOverride) {
    if (!apiKey) return { success: false, message: 'API Key is required.' };
    try {
      const baseUrl = this.getBaseUrl(baseUrlOverride);
      const model =
        modelName ||
        (this.providerName === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }] })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `Connection failed (HTTP ${res.status})`
        };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to connect to API endpoint.'
      };
    }
  }
}

