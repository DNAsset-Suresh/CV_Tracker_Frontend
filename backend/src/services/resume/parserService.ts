import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { logger } from '../../utils/logger.js';

export interface ParseResult {
  text: string;
  method: 'pdf' | 'docx' | 'ocr' | 'fallback';
  characterCount: number;
}

class ParserService {
  /**
   * Main entry point to extract text from a resume document
   */
  async extractText(filePath: string, originalFileName: string): Promise<ParseResult> {
    const ext = path.extname(originalFileName).toLowerCase();
    logger.info(`[Parser] Extracting text from ${originalFileName} (${ext})`);

    try {
      if (ext === '.pdf') {
        return await this.extractFromPdf(filePath);
      } else if (ext === '.docx' || ext === '.doc') {
        return await this.extractFromDocx(filePath);
      } else if (['.png', '.jpg', '.jpeg', '.tiff'].includes(ext)) {
        return await this.extractWithOcr(filePath);
      } else {
        // Fallback text read
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          text: this.sanitizeText(content),
          method: 'fallback',
          characterCount: content.length,
        };
      }
    } catch (err: any) {
      logger.error(`[Parser Error] Text extraction failed for ${originalFileName}: ${err.message}`);
      throw new Error(`Failed to extract document text: ${err.message}`);
    }
  }

  /**
   * Extract text from PDF documents using pdf-parse, with OCR fallback if scanned
   */
  private async extractFromPdf(filePath: string): Promise<ParseResult> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const rawText = pdfData.text || '';
    const cleanText = this.sanitizeText(rawText);

    // If PDF text is very short (< 60 chars), it's likely a scanned image PDF!
    if (cleanText.trim().length < 60) {
      logger.info(`[Parser] PDF text sparse (${cleanText.length} chars). Falling back to OCR.`);
      try {
        return await this.extractWithOcr(filePath);
      } catch (ocrErr: any) {
        logger.warn(`[Parser] OCR fallback failed: ${ocrErr.message}. Returning sparse text.`);
      }
    }

    return {
      text: cleanText,
      method: 'pdf',
      characterCount: cleanText.length,
    };
  }

  /**
   * Extract text from DOCX files using Mammoth
   */
  private async extractFromDocx(filePath: string): Promise<ParseResult> {
    const result = await mammoth.extractRawText({ path: filePath });
    const cleanText = this.sanitizeText(result.value || '');
    return {
      text: cleanText,
      method: 'docx',
      characterCount: cleanText.length,
    };
  }

  /**
   * Perform Optical Character Recognition (OCR) for scanned PDFs and image files
   */
  private async extractWithOcr(filePath: string): Promise<ParseResult> {
    const worker = await createWorker('eng');
    try {
      const ret = await worker.recognize(filePath);
      const cleanText = this.sanitizeText(ret.data.text || '');
      await worker.terminate();

      return {
        text: cleanText,
        method: 'ocr',
        characterCount: cleanText.length,
      };
    } catch (err: any) {
      await worker.terminate();
      throw err;
    }
  }

  /**
   * Document sanitization:
   * - Strips unprintable control characters
   * - Normalizes multiple spaces and newlines
   * - Preserves English and Tamil Unicode ranges
   */
  sanitizeText(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
}

export const parserService = new ParserService();

