import { RateLimiterService } from './RateLimiterService';
import { PromptBuilder } from './PromptBuilder';
import { ResponseParser } from './ResponseParser';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAICompatibleProvider } from './providers/OpenAICompatibleProvider';

/**
 * AIService (Orchestrator - Strategy Pattern & SOLID Principles)
 */
export class AIService {
  constructor() {
    this.rateLimiter = new RateLimiterService();
    this.apiConfig = {
      useCustom: false,
      provider: 'gemini',
      customKey: '',
      customModel: ''
    };

    // Registered Provider Strategies (Open/Closed Principle)
    this.providers = {
      gemini: new GeminiProvider(this.apiConfig),
      openai: new OpenAICompatibleProvider('openai', this.apiConfig),
      groq: new OpenAICompatibleProvider('groq', this.apiConfig),
      custom: new OpenAICompatibleProvider('custom', this.apiConfig)
    };
  }

  setApiConfig(config) {
    this.apiConfig = { ...this.apiConfig, ...config };
    this.providers.gemini.setApiConfig(this.apiConfig);
    this.providers.openai.setApiConfig(this.apiConfig);
    this.providers.groq.setApiConfig(this.apiConfig);
    this.providers.custom.setApiConfig(this.apiConfig);
  }

  getModelName() {
    if (this.apiConfig.useCustom) {
      if (this.apiConfig.customModel) return this.apiConfig.customModel;
      const prov = this.apiConfig.provider || 'gemini';
      if (prov === 'openai') return 'gpt-4o-mini';
      if (prov === 'groq') return 'llama-3.3-70b-versatile';
      if (prov === 'custom') return 'openrouter/auto';
      return 'gemini-3.1-flash-lite';
    }
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-lite';
    }
    return 'PhiLia520';
  }

  getProvider() {
    if (this.apiConfig.useCustom && this.apiConfig.customKey) {
      const provName = this.apiConfig.provider || 'gemini';
      return this.providers[provName] || this.providers.gemini;
    }
    return this.providers.gemini;
  }

  async generateResponse(
    messages,
    persona,
    userName,
    userLocation,
    affinityLevel = 0,
    memories = [],
    currentMood = 'Normal',
    availablePersonas = []
  ) {
    this.rateLimiter.check();

    const contents = messages.map((msg) => {
      const parts = [];
      let text = msg.content || '';
      if (msg.replyTo) {
        text = `[Replying to message: "${msg.replyTo.content || 'Attachment'}"]\n\n${text}`;
      }

      if (text.trim() !== '') {
        parts.push({ text: text.trim() });
      }

      if (msg.image) {
        const dataUrl = typeof msg.image === 'string' ? msg.image : msg.image.url;
        try {
          const mimeType = dataUrl.match(/data:(.*?);/)[1];
          const base64Data = dataUrl.split(',')[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        } catch (err) {
          console.error('[AIService] Failed to parse attachment data', err);
        }
      }

      if (parts.length === 1 && msg.image && (!msg.content || msg.content.trim() === '')) {
        const isDoc = typeof msg.image === 'object' && !msg.image.type?.startsWith('image/');
        parts.unshift({ text: isDoc ? 'Tolong analisa dokumen ini:' : 'Analisa gambar ini:' });
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    try {
      const model = this.getModelName();
      const finalSystemPrompt = PromptBuilder.buildChatSystemPrompt({
        persona,
        userName,
        userLocation,
        affinityLevel,
        memories,
        currentMood,
        availablePersonas
      });

      const provider = this.getProvider();
      const response = await provider.generateContent(
        model,
        contents,
        { systemInstruction: finalSystemPrompt, temperature: 0.7 },
        this.apiConfig.customKey
      );

      const searchData = ResponseParser.parseGroundingMetadata(
        response.candidates?.[0]?.groundingMetadata
      );

      return { text: response.text, searchData };
    } catch (error) {
      console.error('[AIService] AI Generation Error:', error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gemini_api_error', { detail: { error } }));
      }
      throw error;
    }
  }

  async generateUtilityResponse(prompt, systemInstruction, attachment = null) {
    this.rateLimiter.check();

    try {
      const model = this.getModelName();
      const parts = [{ text: prompt }];

      if (attachment?.data && attachment?.mimeType) {
        parts.push({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        });
      }

      const provider = this.getProvider();
      const response = await provider.generateContent(
        model,
        [{ role: 'user', parts: parts }],
        { systemInstruction, temperature: 0.5 },
        this.apiConfig.customKey
      );

      return response.text;
    } catch (error) {
      console.error('[AIService] AI Utility Generation Error:', error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gemini_api_error', { detail: { error } }));
      }
      throw error;
    }
  }

  async testApiConnection(apiKey, modelName, providerName, customBaseUrl = '') {
    if (!apiKey) return { success: false, message: 'API Key is required.' };
    try {
      const prov = this.providers[providerName] || this.providers.gemini;
      return await prov.testConnection(apiKey, modelName, customBaseUrl || this.apiConfig?.customBaseUrl || this.apiConfig?.baseUrl);
    } catch (error) {
      console.error('[AIService] API Test Error:', error);
      let errorMessage = error.message || 'Failed to connect to the API.';

      try {
        const jsonMatch = errorMessage.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          } else if (Array.isArray(parsed) && parsed[0]?.error?.message) {
            errorMessage = parsed[0].error.message;
          }
        }
      } catch {
        console.warn('[AIService] Failed to parse API error response.');
      }

      if (errorMessage.includes('Quota exceeded') || errorMessage.toLowerCase().includes('quota')) {
        errorMessage =
          'Your API Key has exceeded its usage quota or is not eligible for the free tier. Please check your billing.';
      } else if (
        errorMessage.includes('API key not valid') ||
        errorMessage.includes('Incorrect API key')
      ) {
        errorMessage = 'The API key you provided is invalid. Please double-check it.';
      }

      return { success: false, message: errorMessage };
    }
  }

  async generateExamFromPdf(base64Data, mimeType, topic, questionCount) {
    this.rateLimiter.check();
    try {
      const model = this.getModelName();
      const quizPrompt = `Anda adalah Cyrene, asisten AI pembuat soal. Buat tepat ${questionCount} soal pilihan ganda dari dokumen terlampir.
Topik: ${topic || 'Materi komprehensif'}.

ATURAN MUTLAK (JIKA DILANGGAR SISTEM AKAN HANCUR):
1. Gunakan Bahasa Indonesia baku.
2. Berikan 4 opsi jawaban (A, B, C, D).
3. Acak posisi jawaban benar ('answerIndex' dari 0 sampai 3).
4. HANYA keluarkan array JSON valid. TANPA markdown, TANPA spasi berlebih, TANPA teks intro/outro.

Gunakan format persis seperti ini:
[
  {
    "question": "Apa fungsi utama mitokondria?",
    "options": ["A. Pencernaan", "B. Respirasi", "C. Ekskresi", "D. Sirkulasi"],
    "answerIndex": 1,
    "correctExplanation": "Mitokondria berfungsi untuk respirasi sel.",
    "wrongExplanations": [
      "A. Pencernaan salah karena itu tugas lisosom.",
      "C. Ekskresi salah karena itu tugas vakuola.",
      "D. Sirkulasi salah karena sel tidak memiliki sistem itu."
    ]
  }
]`;

      const provider = this.getProvider();
      const response = await provider.generateContent(
        model,
        [
          {
            role: 'user',
            parts: [
              { text: quizPrompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ],
        { responseMimeType: 'application/json' },
        this.apiConfig.customKey
      );

      return ResponseParser.parseJsonArrayResponse(response.text);
    } catch (error) {
      console.error('[AIService] AI Exam Generation Error:', error);
      throw error;
    }
  }

  async generateFlashcardsFromDocument(base64Data, mimeType, topic, numCards) {
    this.rateLimiter.check();
    try {
      const model = this.getModelName();
      const prompt = `Based on the attached document and topic, create a JSON array of EXACTLY ${numCards} highly educational flashcards for study purposes.
Topic/Context: ${topic || 'General Material'}.

Extract the most important concepts, terms, and facts. The questions should be clear and concise. The answers should be accurate and easy to memorize.
Format the output STRICTLY as a valid JSON array like this:
[
  { "question": "What is ...?", "answer": "..." },
  { "question": "Explain ...", "answer": "..." }
]`;

      const parts = [{ text: prompt }];
      if (base64Data && mimeType) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const provider = this.getProvider();
      const response = await provider.generateContent(
        model,
        [{ role: 'user', parts }],
        { responseMimeType: 'application/json' },
        this.apiConfig.customKey
      );

      return ResponseParser.parseJsonArrayResponse(response.text);
    } catch (error) {
      console.error('[AIService] AI Flashcard Generation Error:', error);
      throw error;
    }
  }
}
