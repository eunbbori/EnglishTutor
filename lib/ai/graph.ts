import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { NeonCheckpointer } from "./checkpointer";
import { UserProfileManager, RecurringMistake } from "./user-profile";
import { ConversationSummarizer } from "./summarizer";
import { correctionSchema } from "./schema";
import { getOrCreateUserProfile } from "@/lib/db/user-profile";
import { getRecentTopMistakes } from "@/lib/db/mistakes";

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
});

/**
 * English Tutor Graph
 * Implements memory management with:
 * - Event-based memory (Checkpointer)
 * - Fact memory (User Profile)
 * - Conversation summarization (when > 5 messages)
 * - Async memory updates
 */
export class EnglishTutorGraph {
  private model: ChatGoogleGenerativeAI;
  private graph: ReturnType<typeof this.buildGraph>;
  private summarizer: ConversationSummarizer;

  private readonly SYSTEM_PROMPT = `You are an expert English tutor for Korean speakers with 10 years of experience in Silicon Valley.

Your role:
1. Analyze the user's input (Korean or awkward English) for grammatical errors, awkward phrasing, and unnatural expressions
2. Provide a natural, native-like English correction
3. Explain the corrections in Korean, focusing on:
   - Grammar rules
   - Cultural nuances
   - Common mistakes Korean speakers make
4. Offer three alternative expressions:
   - Formal: For business or academic contexts
   - Casual: For everyday conversation
   - Idiomatic: Using native English idioms

Be encouraging and constructive. Focus on helping the user improve naturally.

{USER_PROFILE_CONTEXT}

IMPORTANT: Respond with a JSON object with these EXACT fields:
- originalText: The user's input as-is
- correctedText: Natural, native-like English
- koreanExplanation: Clear explanation in Korean
- alternatives: Array of exactly 3 objects, each with:
  * type: "Formal", "Casual", or "Idiomatic"
  * text: The alternative expression
- mistakeType: Classify the mistake in format "category:subcategory". REQUIRED field.
  * Grammar errors:
    - "grammar:tense" (wrong tense: "I go yesterday" → "I went yesterday")
    - "grammar:subject_verb_agreement" ("he go" → "he goes")
    - "grammar:preposition" (wrong/missing preposition: "go school" → "go to school")
    - "grammar:article" (wrong/missing article: "I am student" → "I am a student")
    - "grammar:word_order" (incorrect sentence structure)
    - "grammar:plural" (singular/plural mistakes)
    - "grammar:voice" (active/passive voice issues)
    - "grammar:modals" (modal verb mistakes)
  * Vocabulary errors:
    - "vocabulary:word_choice" (wrong word selection)
    - "vocabulary:collocation" (unnatural word combinations)
    - "vocabulary:register" (inappropriate formality level)
  * Style improvements:
    - "style:formality" (formality level adjustment needed)
    - "style:clarity" (unclear or ambiguous expression)
    - "style:conciseness" (too wordy or redundant)
  * Set to null ONLY if the input is already perfect native English
- mistakePattern: ALWAYS identify the grammatical pattern if there's an error. Use kebab-case categories:
  * "preposition-usage" (missing or wrong prepositions like "go school" → "go to school")
  * "article-usage" (missing or wrong articles like "I am student" → "I am a student")
  * "subject-verb-agreement" (e.g., "he go" → "he goes")
  * "tense-confusion" (wrong tense usage)
  * "word-order" (incorrect sentence structure)
  * "plural-forms" (singular/plural mistakes)
  * Set to null ONLY if the input is already correct or is a pure translation request`;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
    });
    this.summarizer = new ConversationSummarizer(5);
    this.graph = this.buildGraph();
  }

  /**
   * Build adaptive context based on user level and recent mistakes
   */
  private async buildAdaptiveContext(userId: string): Promise<string> {
    try {
      // Get user profile
      const profile = await getOrCreateUserProfile(userId);
      console.log(`[Adaptive Context] User level: ${profile.level}`);

      // Get recent top mistakes (last 7 days, TOP 3)
      const recentMistakes = await getRecentTopMistakes(userId, 3);
      console.log(`[Adaptive Context] Recent mistakes: ${recentMistakes.length} found`);

      // Build context string
      let context = "\nUser Profile:";
      context += `\n- Level: ${profile.level.toUpperCase()}`;

      if (profile.learningGoal) {
        context += `\n- Learning Goal: ${profile.learningGoal}`;
      }

      if (recentMistakes.length > 0) {
        context += "\n- Recent Mistakes (last 7 days):";
        recentMistakes.forEach((mistake) => {
          context += `\n  * ${mistake.pattern} (${mistake.frequency}x)`;
        });
      }

      // Add level-specific guidance
      context += "\n\nLevel-Specific Guidance:";
      switch (profile.level) {
        case "beginner":
          context += `
- Use simple vocabulary and short sentences in explanations
- Focus on basic grammar rules (tenses, articles, prepositions)
- Provide step-by-step breakdown of corrections
- Use more Korean in explanations for clarity
- Be extra encouraging and patient`;
          break;
        case "intermediate":
          context += `
- Balance between simple and advanced vocabulary
- Explain nuances and cultural context
- Point out common intermediate-level mistakes
- Encourage natural expression over literal translation
- Build confidence with positive reinforcement`;
          break;
        case "advanced":
          context += `
- Use sophisticated vocabulary in alternatives
- Focus on subtle nuances and stylistic improvements
- Explain idiomatic expressions and cultural references
- Challenge with advanced grammar concepts
- Provide professional and academic register options`;
          break;
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
    const { messages, summary, userProfile, userId } = state;

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
    const systemPrompt = this.SYSTEM_PROMPT.replace(
      "{USER_PROFILE_CONTEXT}",
      adaptiveContext
    );

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
   * - Triggers summarization if message count > 5
   */
  private async updateMemory(state: typeof ConversationState.State) {
    const { messages, correctionResult, userId, chatId, messageCount } = state;

    console.log(`[Memory] Starting memory update (messageCount: ${messageCount})`);

    // 1. Update user profile with recurring mistakes
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

    // 2. Trigger summarization if needed
    if (this.summarizer.shouldSummarize(messageCount)) {
      console.log(`[Memory] Triggering summarization (threshold exceeded: ${messageCount} > 5)`);
      try {
        const cleanedMessages = this.summarizer.cleanMessages(messages);
        const { summary, recentMessages } = await this.summarizer.compactMessages(
          cleanedMessages,
          3 // Keep last 3 messages
        );

        // Update chat summary in database
        await this.summarizer.updateChatSummary(chatId, summary);

        console.log(`[Memory] ✓ Created summary for chat ${chatId}`);

        return {
          summary,
        };
      } catch (error) {
        console.error("[Memory] ✗ Error during summarization:", error);
      }
    } else {
      console.log(`[Memory] Summarization not needed (messageCount: ${messageCount} <= 5)`);
    }

    return {};
  }

  /**
   * Compile graph with checkpointer
   */
  compileWithCheckpointer(chatId: string) {
    const checkpointer = new NeonCheckpointer(chatId);
    const workflow = new StateGraph(ConversationState)
      .addNode("generate_response", this.generateResponse.bind(this))
      .addNode("update_memory", this.updateMemory.bind(this))
      .addEdge(START as any, "generate_response" as any)
      .addEdge("generate_response" as any, "update_memory" as any)
      .addEdge("update_memory" as any, END as any);

    return workflow.compile({ checkpointer });
  }

  /**
   * Get the compiled graph
   */
  getGraph() {
    return this.graph;
  }
}
