import { z } from "zod";

export const alternativeSchema = z.object({
  type: z.enum(["Casual", "Expressive", "Simple"]).describe("The style of the alternative for diary writing"),
  text: z.string().describe("The alternative expression"),
});

// Mistake type classification schema for diary corrections
export const mistakeTypeSchema = z
  .string()
  .nullable()
  .describe(
    'Structured mistake classification in format "category:subcategory". Examples: "grammar:tense", "grammar:subject_verb_agreement", "grammar:preposition", "grammar:article", "vocabulary:word_choice", "vocabulary:collocation", "expression:unnatural", "expression:direct_translation". Set to null if no mistake detected.'
  );

export const correctionSchema = z.object({
  originalText: z.string().describe("The user's original input"),
  correctedText: z.string().describe("The natural, native-like English correction"),
  koreanExplanation: z.string().describe("Grammatical or cultural explanation in Korean"),
  alternatives: z
    .array(alternativeSchema)
    .length(3)
    .describe("3 alternative expressions (Casual, Expressive, Simple)"),
  mistakeType: mistakeTypeSchema,
  mistakePattern: z
    .string()
    .nullable()
    .describe('Recurring mistake pattern if detected (e.g., "preposition-usage", "article-usage", "subject-verb-agreement", "tense-confusion"). Set to null if no clear pattern.'),
  insight: z
    .string()
    .optional()
    .describe("Optional insight message for recurring mistakes (3+ occurrences in 7 days). Provides a brief rule summary and encouragement in Korean."),
});

export type AlternativeExpression = z.infer<typeof alternativeSchema>;
export type CorrectionResponse = z.infer<typeof correctionSchema>;
