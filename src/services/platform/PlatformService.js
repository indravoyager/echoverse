/**
 * PlatformService.js
 * Unified Platform Abstraction Layer for Echo ATURAI
 * Handles Web runtime implementations for:
 * - File Saving / Exporting
 * - Sharing & Copying
 */

export class PlatformService {
  /**
   * Check if running as a Web App
   */
  static isWeb() {
    return true;
  }

  /**
   * Get current platform name
   * @returns {'web'}
   */
  static getPlatformName() {
    return 'web';
  }

  /**
   * Save / Download file in standard Web Browser
   * @param {string} fileName - Target file name (e.g. "result.png")
   * @param {Blob | ArrayBuffer | string} fileData - File content
   * @param {string} [mimeType='application/octet-stream'] - MIME type
   */
  static async saveFile(fileName, fileData, mimeType = 'application/octet-stream') {
    try {
      let blob = fileData;
      if (!(fileData instanceof Blob)) {
        blob = new Blob([fileData], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return { success: true, method: 'web' };
    } catch (err) {
      console.error('[PlatformService] Error saving file:', err);
      throw err;
    }
  }

  /**
   * Share content using Web Share API if available, or clipboard fallback
   * @param {{ title?: string, text?: string, url?: string }} options
   */
  static async shareContent({ title, text, url }) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (err) {
        console.warn('[PlatformService] Web Share API failed:', err);
      }
    }

    // Fallback: Copy URL or text to Clipboard
    const copyTarget = url || text || title || '';
    if (copyTarget && navigator.clipboard) {
      await navigator.clipboard.writeText(copyTarget);
      return 'copied';
    }
    return false;
  }
}

