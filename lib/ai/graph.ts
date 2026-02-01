import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { UserProfileManager, RecurringMistake } from "./user-profile";
import { correctionSchema } from "./schema";
import { getOrCreateUserProfile, getExplanationStyle } from "@/lib/db/user-profile";
import { getRecentTopMistakes } from "@/lib/db/mistakes";
import { validateResponseForLevel, formatValidationLog } from "./response-validator";

/**
 * Diary context type for Daily English
 */
export interface DiaryContext {
  mode: "diary";
}

/**
 * State definition for the conversation graph
 */
const ConversationState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (existing, update) => {
      if (!existing) return update;
      return [...existing, ...update];
    },
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  userProfile: Annotation<RecurringMistake[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  messageCount: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  chatId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "default-user",
  }),
  correctionResult: Annotation<any>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  diaryContext: Annotation<DiaryContext>({
    reducer: (_, update) => update,
    default: () => ({ mode: "diary" }),
  }),
});

/**
 * English Tutor Graph
 * Implements memory management with:
 * - Fact memory (User Profile)
 * - Async memory updates
 */
export class EnglishTutorGraph {
  private model: ChatGoogleGenerativeAI;
  private graph: ReturnType<typeof this.buildGraph>;

  private readonly SYSTEM_PROMPT = `You are Daily English, a friendly and encouraging English diary tutor for Korean learners.

Your role:
1. Help users practice English by correcting their diary entries
2. Be warm, supportive, and patient - this is about building a daily writing habit
3. Explain corrections in simple Korean that beginners can understand
4. Focus on natural, everyday expressions rather than formal English
5. Offer alternative ways to express their thoughts

{USER_PROFILE_CONTEXT}

Key focus areas for diary writing:
- Past tense usage (since diaries usually describe what happened)
- Natural expressions for feelings and emotions
- Common daily life vocabulary
- Simple and clear sentence structures
- Korean-to-English translation patterns to avoid

When correcting:
- Be encouraging! Praise what they did well
- Explain WHY something is wrong, not just what's correct
- Use simple examples they can relate to
- If the entry is mostly correct, still provide helpful tips

IMPORTANT: Respond with a JSON object with these EXACT fields:
- originalText: The user's diary entry as-is
- correctedText: Natural, corrected English suitable for a diary
- koreanExplanation: Friendly, encouraging explanation in Korean. Start with positive feedback, then explain corrections simply.
- alternatives: Array of exactly 3 objects, each with:
  * type: "Casual", "Expressive", or "Simple"
  * text: Alternative ways to express the same idea
- keywords: Array of 1-3 English keywords that represent the main topics of the diary entry (e.g., ["work", "coffee", "tired"]). Keep keywords short and simple.
- mistakeType: Classify the mistake in format "category:subcategory". REQUIRED field.
  * Grammar errors:
    - "grammar:tense" (wrong tense, especially past tense)
    - "grammar:subject_verb_agreement" ("he go" → "he goes")
    - "grammar:preposition" (wrong/missing preposition)
    - "grammar:article" (wrong/missing article)
    - "grammar:word_order" (incorrect sentence structure)
    - "grammar:plural" (singular/plural mistakes)
  * Expression errors:
    - "expression:unnatural" (grammatically correct but unnatural)
    - "expression:too_formal" (too stiff for a diary)
    - "expression:direct_translation" (translated directly from Korean)
  * Vocabulary errors:
    - "vocabulary:word_choice" (wrong word selection)
    - "vocabulary:collocation" (unnatural word combinations)
  * Set to null ONLY if the input is already natural English
- mistakePattern: ALWAYS identify the pattern if there's an error. Use kebab-case:
  * "preposition-usage", "article-usage", "subject-verb-agreement", "tense-confusion"
  * "direct-translation" (Korean sentence structure directly translated)
  * "word-order", "collocation", "vocabulary-choice"
  * Set to null ONLY if the input is already correct`;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro", // Latest model with best instruction-following
      temperature: 0.9, // Higher temperature for more diverse responses
      apiKey: process.env.GOOGLE_API_KEY, // Explicitly pass API key
    });
    this.graph = this.buildGraph();
  }


  /**
   * Build adaptive context based on user level and recent mistakes
   */
  private async buildAdaptiveContext(userId: string): Promise<string> {
    try {
      // Get user profile
      const profile = await getOrCreateUserProfile(userId);
      const explanationStyle = getExplanationStyle(profile);
      const userLevel = profile.xpLevel || 1;
      console.log(`[Adaptive Context] User level: ${userLevel}, explanation style: ${explanationStyle}`);

      // Get recent top mistakes (last 7 days, TOP 3)
      const recentMistakes = await getRecentTopMistakes(userId, 3);
      console.log(`[Adaptive Context] Recent mistakes: ${recentMistakes.length} found`);

      // Build context string
      let context = "\nUser Profile:";
      context += `\n- Explanation Style: ${explanationStyle.toUpperCase()}`;

      if (profile.learningGoal) {
        context += `\n- Learning Goal: ${profile.learningGoal}`;
      }

      if (recentMistakes.length > 0) {
        context += "\n- Recent Mistakes (last 7 days):";
        recentMistakes.forEach((mistake) => {
          context += `\n  * ${mistake.pattern} (${mistake.frequency}x)`;
        });
      }

      // Add level-specific guidance for diary writing
      context += "\n\nLevel-Based Explanation Guidance for Diary:";

      if (userLevel <= 10) {
        // Beginner (Lv.1-10): 70-90% Korean
        context += `
- User Level: ${userLevel} (Beginner)
- Use simple vocabulary and short sentences
- Focus on basic grammar rules (past tense, articles, prepositions)
- Provide step-by-step breakdown with relatable examples
- Use mostly Korean in explanations (70-90%)
- Be warm and encouraging - this is about building a writing habit!
- Make explanations friendly and conversational

EXAMPLE for BEGINNER:
Input: "Today I eat delicious food"
Korean Explanation: "오늘 일기 잘 쓰셨어요! 👏 한 가지만 고치면 더 자연스러워져요. 일기는 보통 '오늘 있었던 일'을 쓰는 거라서 과거형을 써요. 'eat'의 과거형은 'ate'예요! 'Today I ate delicious food' 이렇게 쓰면 완벽해요. 앞으로 일기 쓸 때 '오늘 ~했다'는 과거형으로 써보세요!"`;
      } else if (userLevel <= 20) {
        // Intermediate (Lv.11-20): 50-70% Korean
        context += `
- User Level: ${userLevel} (Intermediate)
- Balance Korean and English (50-70% Korean)
- Focus on key correction points
- Include some English explanations for advanced concepts
- Be supportive but efficient

EXAMPLE for INTERMEDIATE:
Input: "Today I eat delicious food"
Korean Explanation: "좋은 표현이에요! 일기는 과거 일을 쓰는 거라서 'eat' → 'ate'로 바꿔주세요. When describing past events, use past tense. 'Today I ate delicious food'가 자연스러워요."`;
      } else {
        // Advanced (Lv.21+): 30-50% Korean
        context += `
- User Level: ${userLevel} (Advanced)
- Use mostly English explanations (30-50% Korean)
- Focus on nuance and natural expression
- Provide concise, professional feedback
- Challenge the user to use more sophisticated language

EXAMPLE for ADVANCED:
Input: "Today I eat delicious food"
Korean Explanation: "'eat' → 'ate' (past tense needed). For diary entries about past events, use simple past. Consider more expressive alternatives: 'savored', 'enjoyed', 'indulged in' 맛있는 음식을 먹었다는 표현을 더 풍부하게 해보세요!"`;
      }

      return context;
    } catch (error) {
      console.error("[Graph] Error building adaptive context:", error);
      return "";
    }
  }

  /**
   * Build the state graph
   */
  private buildGraph() {
    const workflow = new StateGraph(ConversationState)
      .addNode("generate_response", this.generateResponse.bind(this))
      .addNode("update_memory", this.updateMemory.bind(this))
      .addEdge(START as any, "generate_response" as any)
      .addEdge("generate_response" as any, "update_memory" as any)
      .addEdge("update_memory" as any, END as any);

    return workflow.compile();
  }

  /**
   * Node: Generate AI response with correction
   */
  private async generateResponse(state: typeof ConversationState.State) {
    const { messages, summary, userId } = state;

    // Build adaptive context based on user level and recent mistakes
    const adaptiveContext = await this.buildAdaptiveContext(userId);

    // Prepare context
    let contextMessages: BaseMessage[] = [];

    // Add summary if exists
    if (summary) {
      contextMessages.push(
        new AIMessage(`Previous conversation summary:\n${summary}`)
      );
    }

    // Add recent messages
    contextMessages.push(...messages);

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage._getType() !== "human") {
      throw new Error("Last message must be from user");
    }

    // Build system prompt with adaptive context
    const systemPrompt = this.SYSTEM_PROMPT
      .replace("{USER_PROFILE_CONTEXT}", adaptiveContext);

    console.log("[Graph] Generating diary correction response");

    try {
      // Call LLM with proper system message
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        ...contextMessages,
      ]);

      // Parse JSON response
      const content = response.content as string;
      let correctionResult;

      try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsedJSON = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

        // Validate with Zod schema
        const validationResult = correctionSchema.safeParse(parsedJSON);

        if (validationResult.success) {
          correctionResult = validationResult.data;
          console.log("[Graph] ✓ Response validated successfully");
          console.log("[Graph] Mistake type:", correctionResult.mistakeType);
        } else {
          console.error("[Graph] ✗ Validation failed:", validationResult.error.errors);
          // Use parsed JSON even if validation fails (for debugging)
          correctionResult = parsedJSON;
        }
      } catch (error) {
        // Fallback if JSON parsing fails
        console.error("[Graph] ✗ JSON parsing failed:", error);
        correctionResult = {
          originalText: lastUserMessage.content,
          correctedText: content,
          koreanExplanation: "응답을 파싱할 수 없습니다.",
          alternatives: [],
          mistakeType: null,
          mistakePattern: null,
        };
      }

      // Validate response quality for user's level
      try {
        const userProfileData = await getOrCreateUserProfile(userId);
        const explanationStyle = getExplanationStyle(userProfileData);
        const validation = validateResponseForLevel(
          correctionResult,
          explanationStyle
        );

        // Log validation results
        console.log(formatValidationLog(validation, explanationStyle));

        // Warn if validation fails
        if (!validation.isValid) {
          console.warn("[Graph] ⚠️  Response quality does not match expected level!");
        }
      } catch (validationError) {
        console.error("[Graph] ✗ Validation error:", validationError);
        // Don't fail the request if validation fails
      }

      const aiMessage = new AIMessage(JSON.stringify(correctionResult));

      return {
        messages: [aiMessage],
        correctionResult,
        messageCount: messages.length + 1,
      };
    } catch (error) {
      console.error("[Graph] Error generating response:", error);
      throw error;
    }
  }

  /**
   * Node: Update memory (async, after response is sent)
   * - Updates user profile with recurring mistakes
   */
  private async updateMemory(state: typeof ConversationState.State) {
    const { correctionResult, userId } = state;

    console.log(`[Memory] Starting memory update`);

    // Update user profile with recurring mistakes
    if (correctionResult?.mistakePattern) {
      const profileManager = new UserProfileManager(userId);
      try {
        await profileManager.addRecurringMistake(
          correctionResult.mistakePattern,
          correctionResult.originalText
        );
        console.log(
          `[Memory] ✓ Recorded recurring mistake: ${correctionResult.mistakePattern}`
        );
      } catch (error) {
        console.error("[Memory] ✗ Error updating user profile:", error);
      }
    } else {
      console.log("[Memory] No mistake pattern detected, skipping user profile update");
    }

    return {};
  }

  /**
   * Get the compiled graph
   */
  getGraph() {
    return this.graph;
  }
}
