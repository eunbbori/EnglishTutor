import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// Zod schema for structured vocabulary enrichment
export const vocabularyEnrichmentSchema = z.object({
  meaning: z.string().describe("한국어 뜻 (context를 고려한 의미)"),
  pronunciation: z.string().describe("IPA 발음 기호 (예: /ˈɡreɪtfəl/)"),
  partOfSpeech: z.string().describe("품사 (예: noun, verb, adjective, adverb)"),
  synonyms: z.array(z.string()).max(3).describe("동의어 목록 (최대 3개)"),
  example: z.string().describe("새로운 예문 (context와 다른 문장)"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("난이도 (문맥에서의 사용 기준)"),
});

export type VocabularyEnrichment = z.infer<typeof vocabularyEnrichmentSchema>;

/**
 * AI를 사용하여 단어/표현을 자동으로 enrichment합니다.
 * 
 * @param selectedText - 사용자가 선택한 단어나 표현
 * @param fullContext - 선택한 텍스트가 포함된 전체 문맥 (최대 500자)
 * @returns Enriched vocabulary data
 * @throws Error if AI call fails (caller should handle gracefully)
 */
export async function enrichVocabulary(params: {
  selectedText: string;
  fullContext: string;
}): Promise<VocabularyEnrichment> {
  const { selectedText, fullContext } = params;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  // Initialize Gemini model with structured output
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.3, // Low temperature for consistency
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const structuredModel = model.withStructuredOutput(vocabularyEnrichmentSchema);

  // Create prompt for vocabulary enrichment
  const prompt = `You are an English vocabulary expert helping Korean learners.

Selected text: "${selectedText}"
Context: "${fullContext}"

Please analyze the selected text and provide:
1. meaning: 한국어 뜻 (context를 고려하여 정확한 의미 제공)
2. pronunciation: IPA 발음 기호 (예: /ˈɡreɪtfəl/)
3. partOfSpeech: 품사 (noun, verb, adjective, adverb 등)
4. synonyms: 동의어 최대 3개 (영어로)
5. example: 새로운 예문 (context와 다른 자연스러운 영어 문장)
6. difficulty: 난이도 (beginner/intermediate/advanced - 문맥에서의 사용 난이도 기준)

IMPORTANT:
- meaning은 반드시 한국어로 작성
- example은 context와 완전히 다른 새로운 문장을 생성
- pronunciation은 정확한 IPA 표기법 사용
- synonyms는 context에 맞는 동의어만 제공`;

  try {
    // Call Gemini API with 5 second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI enrichment timeout")), 5000)
    );

    const result = await Promise.race([
      structuredModel.invoke(prompt),
      timeoutPromise,
    ]) as VocabularyEnrichment;

    return result;
  } catch (error) {
    console.error("[Vocabulary Enricher] Error:", error);
    throw error; // Let caller handle the error
  }
}
