import fs from 'fs';
import path from 'path';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

class StorageService {
  /**
   * Get the absolute path of a temporary upload file
   */
  getTempFilePath(fileName: string): string {
    return path.join(config.storage.tempDir, fileName);
  }

  /**
   * Check if temporary file exists on disk
   */
  tempFileExists(filePathOrName: string): boolean {
    const fullPath = path.isAbsolute(filePathOrName)
      ? filePathOrName
      : this.getTempFilePath(filePathOrName);
    return fs.existsSync(fullPath);
  }

  /**
   * Delete temporary file immediately after parsing & extraction is complete
   */
  deleteTempFile(filePathOrName: string): void {
    try {
      const fullPath = path.isAbsolute(filePathOrName)
        ? filePathOrName
        : this.getTempFilePath(filePathOrName);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`[Storage] Temporary file deleted successfully: ${path.basename(fullPath)}`);
      }
    } catch (err: any) {
      logger.warn(`[Storage] Could not delete temporary file ${filePathOrName}: ${err.message}`);
    }
  }

  /**
   * Clean up stale temporary files in the temp directory if any exist
   */
  cleanupStaleTempFiles(): void {
    try {
      if (fs.existsSync(config.storage.tempDir)) {
        const files = fs.readdirSync(config.storage.tempDir);
        for (const file of files) {
          const filePath = path.join(config.storage.tempDir, file);
          const stats = fs.statSync(filePath);
          // Delete files older than 1 hour if not already cleaned
          if (Date.now() - stats.mtimeMs > 3600000) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }

  /**
   * Informational metadata regarding file retention policy
   */
  getDataRetentionNotice() {
    return {
      isRetained: false,
      policy: 'Ephemeral Ingestion: Original resume documents (PDF/DOCX) are removed after candidate data extraction in accordance with enterprise data privacy and storage optimization standards. Candidate records are permanently preserved in MongoDB.',
    };
  }
}

export const storageService = new StorageService();
