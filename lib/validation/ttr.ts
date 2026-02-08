/**
 * TTR (Type-Token Ratio) Validation
 * v3.1.1: Prevents volume bonus gaming through word repetition
 */

import { MIN_TTR_FOR_VOLUME_BONUS } from "@/lib/gamification/xp-constants";

/**
 * Calculate TTR (Type-Token Ratio) for a given text
 * TTR = unique words / total words
 *
 * @param text - Input text to analyze
 * @returns TTR value (0.0 to 1.0)
 *
 * @example
 * calculateTTR("I love love you") // Returns 0.75 (3 unique / 4 total)
 * calculateTTR("happy happy happy") // Returns 0.33 (1 unique / 3 total)
 */
export function calculateTTR(text: string): number {
  const words = tokenizeWords(text);

  if (words.length === 0) {
    return 0;
  }

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const ttr = uniqueWords.size / words.length;

  return ttr;
}

/**
 * Check if text is valid for volume-based XP bonuses
 * Requires TTR ≥ 0.4 to prevent "happy happy happy..." gaming
 *
 * @param text - Diary text to validate
 * @returns True if eligible for volume bonuses
 */
export function isValidForVolumeBonus(text: string): boolean {
  const ttr = calculateTTR(text);
  return ttr >= MIN_TTR_FOR_VOLUME_BONUS;
}

/**
 * Get total word count from text
 *
 * @param text - Input text
 * @returns Number of words (whitespace-separated)
 */
export function getWordCount(text: string): number {
  return tokenizeWords(text).length;
}

/**
 * Get unique word count from text
 *
 * @param text - Input text
 * @returns Number of unique words (case-insensitive)
 */
export function getUniqueWordCount(text: string): number {
  const words = tokenizeWords(text);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  return uniqueWords.size;
}

/**
 * Tokenize text into words
 * Handles punctuation and whitespace correctly
 *
 * @param text - Input text
 * @returns Array of word tokens
 */
function tokenizeWords(text: string): string[] {
  // Remove extra whitespace and split by whitespace
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  return words;
}

/**
 * Get TTR validation result with detailed info
 * Useful for debugging and user feedback
 *
 * @param text - Input text
 * @returns Validation result object
 */
export function getTTRValidationResult(text: string): {
  ttr: number;
  totalWords: number;
  uniqueWords: number;
  isValid: boolean;
  requiredTTR: number;
} {
  const totalWords = getWordCount(text);
  const uniqueWords = getUniqueWordCount(text);
  const ttr = calculateTTR(text);
  const isValid = ttr >= MIN_TTR_FOR_VOLUME_BONUS;

  return {
    ttr,
    totalWords,
    uniqueWords,
    isValid,
    requiredTTR: MIN_TTR_FOR_VOLUME_BONUS,
  };
}
