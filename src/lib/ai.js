import { AIService } from '../services/ai/AIService';
import { PromptBuilder } from '../services/ai/PromptBuilder';
import { RateLimiterService } from '../services/ai/RateLimiterService';
import { ResponseParser } from '../services/ai/ResponseParser';

// Re-export core classes for OOP usage
export { AIService, PromptBuilder, RateLimiterService, ResponseParser };

// Singleton Instance
export const aiService = new AIService();

// Backwards-compatible export wrappers
export const setApiConfig = (config) => aiService.setApiConfig(config);
export const generateResponse = (
  messages,
  persona,
  userName,
  userLocation,
  affinityLevel = 0,
  memories = [],
  currentMood = 'Normal',
  availablePersonas = []
) =>
  aiService.generateResponse(
    messages,
    persona,
    userName,
    userLocation,
    affinityLevel,
    memories,
    currentMood,
    availablePersonas
  );

export const generateUtilityResponse = (prompt, systemInstruction, attachment = null) =>
  aiService.generateUtilityResponse(prompt, systemInstruction, attachment);

export const testApiConnection = (apiKey, modelName, provider) =>
  aiService.testApiConnection(apiKey, modelName, provider);

export const generateExamFromPdf = (base64Data, mimeType, topic, questionCount) =>
  aiService.generateExamFromPdf(base64Data, mimeType, topic, questionCount);

export const generateFlashcardsFromDocument = (base64Data, mimeType, topic, numCards) =>
  aiService.generateFlashcardsFromDocument(base64Data, mimeType, topic, numCards);
