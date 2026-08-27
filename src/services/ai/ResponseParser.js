/**
 * ResponseParser (Single Responsibility Principle)
 * Handles parsing, tag extractions (Memory, Mood, Search Grounding), and JSON payload sanitization.
 */
export class ResponseParser {
  static extractMemoriesAndMood(rawText) {
    let cleanText = rawText || '';
    const newMemories = [];
    let detectedMood = 'Normal';

    // Memory Extraction
    const memoryRegex = /\[MEMORY:\s*(.+?)\]/gi;
    let memoryMatch;
    while ((memoryMatch = memoryRegex.exec(cleanText)) !== null) {
      newMemories.push(memoryMatch[1].trim());
    }
    if (newMemories.length > 0) {
      cleanText = cleanText.replace(memoryRegex, '').trim();
    }

    // Mood Extraction
    const moodRegex = /\[MOOD:\s*([a-zA-Z]+)\]/i;
    const moodMatch = cleanText.match(moodRegex);
    if (moodMatch) {
      detectedMood = moodMatch[1];
      cleanText = cleanText.replace(moodRegex, '').trim();
    }

    return {
      cleanText,
      newMemories,
      detectedMood
    };
  }

  static parseGroundingMetadata(groundingMetadata) {
    if (!groundingMetadata || !groundingMetadata.groundingChunks?.length) {
      return null;
    }

    const sources = groundingMetadata.groundingChunks
      .filter((chunk) => chunk.web)
      .map((chunk) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    if (sources.length === 0) return null;

    return {
      queries: groundingMetadata.webSearchQueries || [],
      sources: sources
    };
  }

  static parseJsonArrayResponse(replyText) {
    if (typeof replyText !== 'string' || !replyText.trim()) {
      throw new Error('AI returned empty or invalid response.');
    }

    let cleaned = replyText.replace(/```json/gi, '').replace(/```/g, '');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    } else {
      throw new Error('Format JSON Array tidak ditemukan.');
    }
    
    // Clean control characters and trailing commas before closing brackets
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned
      .replace(/[\u0000-\u001F]+/g, '')
      .replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('[ResponseParser] Failed to parse JSON array:', cleaned, err);
      throw new Error(`Gagal memproses data JSON: ${err.message}`);
    }
  }
}
