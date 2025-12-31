/**
 * Response Quality Validation
 * Validates if AI responses match the expected quality for user's level
 */

export interface ResponseQualityMetrics {
  vocabularyComplexity: number; // 0-100 (simple to complex)
  explanationLength: number; // Characters in Korean explanation
  koreanRatio: number; // 0-1 (percentage of Korean characters)
  alternativesCount: number; // Number of alternatives provided
  hasAllAlternativeTypes: boolean; // Whether all 3 types are present
}

export interface LevelExpectation {
  vocabularyComplexity: { min: number; max: number };
  explanationLength: { min: number; max: number };
  koreanRatio: { min: number; max: number };
}

export interface ValidationResult {
  isValid: boolean;
  metrics: ResponseQualityMetrics;
  expectations: LevelExpectation;
  violations: string[];
  warnings: string[];
}

/**
 * Style-specific expectations for response quality
 */
const LEVEL_EXPECTATIONS: Record<string, LevelExpectation> = {
  detailed: {
    vocabularyComplexity: { min: 0, max: 40 }, // Simple words
    explanationLength: { min: 150, max: 600 }, // Detailed and thorough (2-3x longer)
    koreanRatio: { min: 0.7, max: 1.0 }, // 70-100% Korean (more Korean for clarity)
  },
  concise: {
    vocabularyComplexity: { min: 30, max: 70 }, // Balanced vocabulary
    explanationLength: { min: 60, max: 300 }, // Brief and focused
    koreanRatio: { min: 0.4, max: 0.7 }, // 40-70% Korean
  },
};

/**
 * Calculate vocabulary complexity based on word length and variety
 * Uses average word length and unique word ratio as proxies
 */
function calculateVocabularyComplexity(text: string): number {
  // Extract English words only
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];

  if (words.length === 0) return 0;

  // Calculate average word length
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;

  // Calculate unique word ratio
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const uniqueRatio = uniqueWords.size / words.length;

  // Normalize to 0-100 scale
  // Average word length typically ranges from 3-8 characters
  const lengthScore = Math.min((avgWordLength - 3) / 5, 1) * 60;

  // Unique ratio typically ranges from 0.5-1.0
  const varietyScore = Math.max((uniqueRatio - 0.5) / 0.5, 0) * 40;

  return Math.round(lengthScore + varietyScore);
}

/**
 * Calculate the ratio of Korean characters in text
 */
function calculateKoreanRatio(text: string): number {
  if (!text || text.length === 0) return 0;

  // Count Korean characters (Hangul syllables)
  const koreanChars = text.match(/[\uAC00-\uD7AF]/g) || [];

  // Count total meaningful characters (excluding whitespace and punctuation)
  const meaningfulChars = text.match(/[\uAC00-\uD7AFa-zA-Z0-9]/g) || [];

  if (meaningfulChars.length === 0) return 0;

  return koreanChars.length / meaningfulChars.length;
}

/**
 * Calculate response quality metrics
 */
export function calculateMetrics(response: {
  correctedText?: string;
  koreanExplanation?: string;
  alternatives?: Array<{ type: string; text: string }>;
}): ResponseQualityMetrics {
  const { correctedText = "", koreanExplanation = "", alternatives = [] } = response;

  // Calculate vocabulary complexity from corrected text
  const vocabularyComplexity = calculateVocabularyComplexity(correctedText);

  // Explanation length
  const explanationLength = koreanExplanation.length;

  // Korean ratio in explanation
  const koreanRatio = calculateKoreanRatio(koreanExplanation);

  // Alternatives count
  const alternativesCount = alternatives.length;

  // Check if all alternative types are present
  const types = new Set(alternatives.map((alt) => alt.type));
  const hasAllAlternativeTypes =
    types.has("Formal") && types.has("Casual") && types.has("Idiomatic");

  return {
    vocabularyComplexity,
    explanationLength,
    koreanRatio,
    alternativesCount,
    hasAllAlternativeTypes,
  };
}

/**
 * Validate response quality for a given explanation style
 */
export function validateResponseForLevel(
  response: {
    correctedText?: string;
    koreanExplanation?: string;
    alternatives?: Array<{ type: string; text: string }>;
  },
  userLevel: "detailed" | "concise"
): ValidationResult {
  const metrics = calculateMetrics(response);
  const expectations = LEVEL_EXPECTATIONS[userLevel];

  const violations: string[] = [];
  const warnings: string[] = [];

  // Validate vocabulary complexity
  if (
    metrics.vocabularyComplexity < expectations.vocabularyComplexity.min ||
    metrics.vocabularyComplexity > expectations.vocabularyComplexity.max
  ) {
    violations.push(
      `Vocabulary complexity (${metrics.vocabularyComplexity}) outside expected range [${expectations.vocabularyComplexity.min}, ${expectations.vocabularyComplexity.max}] for ${userLevel} level`
    );
  }

  // Validate explanation length
  if (
    metrics.explanationLength < expectations.explanationLength.min ||
    metrics.explanationLength > expectations.explanationLength.max
  ) {
    violations.push(
      `Explanation length (${metrics.explanationLength}) outside expected range [${expectations.explanationLength.min}, ${expectations.explanationLength.max}] for ${userLevel} level`
    );
  }

  // Validate Korean ratio
  if (
    metrics.koreanRatio < expectations.koreanRatio.min ||
    metrics.koreanRatio > expectations.koreanRatio.max
  ) {
    violations.push(
      `Korean ratio (${(metrics.koreanRatio * 100).toFixed(1)}%) outside expected range [${(expectations.koreanRatio.min * 100).toFixed(0)}%, ${(expectations.koreanRatio.max * 100).toFixed(0)}%] for ${userLevel} level`
    );
  }

  // Validate alternatives
  if (metrics.alternativesCount !== 3) {
    warnings.push(
      `Expected 3 alternatives, got ${metrics.alternativesCount}`
    );
  }

  if (!metrics.hasAllAlternativeTypes) {
    warnings.push(
      "Missing one or more alternative types (Formal, Casual, Idiomatic)"
    );
  }

  const isValid = violations.length === 0;

  return {
    isValid,
    metrics,
    expectations,
    violations,
    warnings,
  };
}

/**
 * Format validation result as a readable log string
 */
export function formatValidationLog(
  validation: ValidationResult,
  userLevel: string
): string {
  const { isValid, metrics, expectations, violations, warnings } = validation;

  let log = `\n[Response Validation] Level: ${userLevel.toUpperCase()}\n`;
  log += `  Status: ${isValid ? "✓ PASS" : "✗ FAIL"}\n`;
  log += `\n  Metrics:\n`;
  log += `    - Vocabulary Complexity: ${metrics.vocabularyComplexity}/100 (expected: ${expectations.vocabularyComplexity.min}-${expectations.vocabularyComplexity.max})\n`;
  log += `    - Explanation Length: ${metrics.explanationLength} chars (expected: ${expectations.explanationLength.min}-${expectations.explanationLength.max})\n`;
  log += `    - Korean Ratio: ${(metrics.koreanRatio * 100).toFixed(1)}% (expected: ${(expectations.koreanRatio.min * 100).toFixed(0)}-${(expectations.koreanRatio.max * 100).toFixed(0)}%)\n`;
  log += `    - Alternatives: ${metrics.alternativesCount}/3 (${metrics.hasAllAlternativeTypes ? "complete" : "incomplete"})\n`;

  if (violations.length > 0) {
    log += `\n  ✗ Violations:\n`;
    violations.forEach((v) => {
      log += `    - ${v}\n`;
    });
  }

  if (warnings.length > 0) {
    log += `\n  ⚠  Warnings:\n`;
    warnings.forEach((w) => {
      log += `    - ${w}\n`;
    });
  }

  return log;
}
