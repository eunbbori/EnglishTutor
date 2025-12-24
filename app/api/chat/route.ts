import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EnglishTutorGraph } from "@/lib/ai/graph";
import { ConversationSummarizer } from "@/lib/ai/summarizer";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { getOrCreateUserProfile } from "@/lib/db/user-profile";
import { saveOrUpdateMistake, checkRecurringPattern } from "@/lib/db/mistakes";

const DEFAULT_USER_ID = "default-user";

/**
 * Generate insight message for recurring mistakes
 * @param pattern - The mistake pattern (e.g., "tense-confusion")
 * @param mistakeType - The mistake type (e.g., "grammar:tense")
 * @param frequency - How many times this mistake occurred
 * @returns Insight message in Korean
 */
function generateInsightMessage(
  pattern: string,
  mistakeType: string,
  frequency: number
): string {
  const patternName = pattern.replace(/-/g, " ");
  const [category, subcategory] = mistakeType.split(":");

  // Pattern-specific insights
  const insights: Record<string, string> = {
    "tense-confusion": "시제 사용에 주의하세요! 과거, 현재, 미래를 명확히 구분하는 것이 중요합니다. 시간 표현(yesterday, tomorrow 등)과 함께 연습해보세요.",
    "subject-verb-agreement": "주어와 동사의 일치에 집중하세요! 3인칭 단수(he/she/it)일 때 동사에 -s를 붙이는 것을 잊지 마세요.",
    "preposition-usage": "전치사 사용을 복습하세요! 각 동사나 명사와 어울리는 전치사를 함께 외우면 도움이 됩니다.",
    "article-usage": "관사(a/an/the) 사용법을 확인하세요! 셀 수 있는 명사 앞에는 관사가 필요합니다.",
    "word-order": "어순을 다시 확인하세요! 영어는 주어-동사-목적어 순서가 기본입니다.",
    "plural-forms": "복수형 사용에 주의하세요! 2개 이상일 때는 -s나 -es를 붙여야 합니다.",
  };

  const specificInsight = insights[pattern] || `'${patternName}' 패턴을 다시 한번 복습해보세요!`;

  return `💡 **반복되는 실수 패턴 발견!** (${frequency}회)\n\n${specificInsight}\n\n꾸준히 연습하면 반드시 개선됩니다. 화이팅! 💪`;
}

export async function POST(req: Request) {
  try {
    const { messages: userMessages, chatId } = await req.json();

    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage || lastUserMessage.role !== "user") {
      return new Response("Invalid message format", { status: 400 });
    }

    // Determine chat ID (create new chat if none exists)
    let currentChatId = chatId;

    if (!currentChatId) {
      // Create new chat session
      const [newChat] = await db
        .insert(chats)
        .values({
          userId: DEFAULT_USER_ID,
          title: lastUserMessage.content.substring(0, 50),
        })
        .returning();

      currentChatId = newChat.id;
    }

    console.log("[API] Processing message for chat:", currentChatId);

    // Initialize or get user profile
    const userProfile = await getOrCreateUserProfile(DEFAULT_USER_ID);
    console.log("[API] User profile loaded:", {
      level: userProfile.level,
      hasGoal: !!userProfile.learningGoal,
    });

    // Load existing messages from database
    const existingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, currentChatId))
      .orderBy(desc(messages.createdAt));

    // Convert to LangChain message format
    const langchainMessages = existingMessages
      .reverse()
      .map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      });

    // Add new user message
    langchainMessages.push(new HumanMessage(lastUserMessage.content));

    // Load summary if exists
    const summarizer = new ConversationSummarizer(5);
    const existingSummary = await summarizer.getChatSummary(currentChatId);

    // Initialize graph with checkpointer
    const tutorGraph = new EnglishTutorGraph();
    const graph = tutorGraph.compileWithCheckpointer(currentChatId);

    // Prepare initial state
    const initialState = {
      messages: langchainMessages,
      summary: existingSummary || "",
      userProfile: Array.isArray(userProfile.recurringMistakes)
        ? userProfile.recurringMistakes
        : [],
      messageCount: langchainMessages.length,
      chatId: currentChatId,
      userId: DEFAULT_USER_ID,
      correctionResult: null,
    };

    // Invoke graph
    console.log("[API] Invoking LangGraph...");

    const result = await graph.invoke(initialState, {
      configurable: {
        thread_id: currentChatId,
      },
    });

    const correctionResult = result.correctionResult;

    console.log("[API] Graph execution completed");
    console.log("[API] Correction result:", JSON.stringify(correctionResult, null, 2));

    // Save messages to database
    try {
      // Save user message
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "user",
        content: lastUserMessage.content,
      });

      // Save assistant message (as JSON string)
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "assistant",
        content: JSON.stringify(correctionResult),
      });

      console.log("[API] Messages saved to database");
    } catch (error) {
      console.error("[DB Error] Failed to save messages:", error);
    }

    // Save mistake pattern to database if detected
    if (correctionResult?.mistakeType && correctionResult?.mistakePattern) {
      try {
        await saveOrUpdateMistake(
          DEFAULT_USER_ID,
          correctionResult.mistakeType,
          correctionResult.mistakePattern,
          correctionResult.originalText || ""
        );
        console.log(
          `[API] Mistake pattern saved: ${correctionResult.mistakeType} - ${correctionResult.mistakePattern}`
        );

        // Check for recurring patterns and generate insight
        const recurringMistake = await checkRecurringPattern(
          DEFAULT_USER_ID,
          correctionResult.mistakePattern
        );

        if (recurringMistake) {
          // Generate insight message for recurring mistakes (3+ occurrences)
          const insightMessage = generateInsightMessage(
            correctionResult.mistakePattern,
            correctionResult.mistakeType,
            recurringMistake.frequency
          );
          correctionResult.insight = insightMessage;
          console.log(`[API] ⚠️  Insight generated for recurring pattern: ${correctionResult.mistakePattern}`);
        }
      } catch (error) {
        console.error("[API] Failed to save mistake pattern:", error);
        // Don't fail the request if mistake saving fails
      }
    }

    // Return the correction result
    return Response.json(
      { object: correctionResult },
      {
        headers: {
          "X-Chat-Id": currentChatId,
        },
      }
    );
  } catch (error) {
    console.error("[API Error]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
