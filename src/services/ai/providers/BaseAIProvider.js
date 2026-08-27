/**
 * Abstract Base Class for AI API Providers (Strategy Pattern & SOLID Principle)
 */
export class BaseAIProvider {
  /**
   * Abstract method for content generation
   * @param {string} model 
   * @param {Array} contents 
   * @param {Object} config 
   */
  async generateContent(model, contents, config) {
    throw new Error('[BaseAIProvider] generateContent method must be implemented by concrete provider strategy.');
  }

  /**
   * Abstract method for testing connection
   * @param {string} apiKey 
   * @param {string} modelName 
   */
  async testConnection(apiKey, modelName) {
    throw new Error('[BaseAIProvider] testConnection method must be implemented by concrete provider strategy.');
  }
}
