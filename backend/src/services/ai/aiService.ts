import { ExtractionServiceInterface } from './aiServiceInterface.js';
import { RuleBasedExtractionService } from './fallbackAIService.js';

/**
 * Standard rule-based extraction service.
 * Deterministic parser utilizing regex, structural extraction, and keyword scoring.
 * No external AI APIs or OpenAI dependencies.
 */
export const aiService: ExtractionServiceInterface = new RuleBasedExtractionService();
export { ExtractionServiceInterface as AIServiceInterface };
export { RuleBasedExtractionService };
