import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EnglishTutorGraph } from "@/lib/ai/graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { getOrCreateUserProfile, getExplanationStyle } from "@/lib/db/user-profile";
import { saveOrUpdateMistake, checkRecurringPattern } from "@/lib/db/mistakes";
import { auth } from "@/lib/auth";
import { getUsageStatus, incrementUsage } from "@/lib/subscription/check-usage";
import { recordDiaryEntry } from "@/lib/streak/streak-manager";
import { grantXp } from "@/lib/gamification/xp-service";

// Vercel timeout configuration (max 60s for Hobby plan)
export const maxDuration = 60;

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

  // Pattern-specific insights for diary writing
  const insights: Record<string, string> = {
    "tense-confusion": "일기는 보통 과거에 있었던 일을 쓰는 거라서, 과거 시제를 자주 써요. 'go → went', 'eat → ate' 같은 불규칙 과거형을 틈틈이 외워보세요!",
    "subject-verb-agreement": "주어가 he/she/it일 때는 동사에 -s를 붙여야 해요. 'She goes', 'It works' 처럼요!",
    "preposition-usage": "전치사는 영어에서 정말 중요해요! 'at home', 'in the morning', 'on Monday' 같은 표현을 통째로 외우면 도움이 돼요.",
    "article-usage": "a/an/the 사용이 어려운 건 당연해요! 특정한 것을 말할 때는 'the', 처음 말하는 것은 'a/an'을 써요.",
    "word-order": "한국어와 영어는 어순이 달라요! 영어는 '주어 + 동사 + 목적어' 순서로 써야 해요.",
    "direct-translation": "한국어를 그대로 번역하면 어색할 수 있어요. 영어식 표현을 조금씩 익혀봐요!",
  };

  const specificInsight = insights[pattern] || `'${patternName}' 부분을 조금만 더 연습하면 금방 늘어요!`;

  return `📝 **자주 틀리는 부분이에요** (${frequency}회)\n\n${specificInsight}\n\n매일 일기 쓰면서 자연스럽게 실력이 늘거에요! 오늘도 수고했어요 ✨`;
}

export async function POST(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[API Error] Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Google API key not configured"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!process.env.DATABASE_URL) {
      console.error("[API Error] Missing DATABASE_URL");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Database URL not configured"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check authentication and usage limits
    const session = await auth();
    const userId = session?.user?.id || DEFAULT_USER_ID;
    const isAuthenticated = !!session?.user?.id;

    // Check usage limits for authenticated users
    if (isAuthenticated) {
      const usageStatus = await getUsageStatus(userId);
      if (!usageStatus.canUse) {
        return new Response(
          JSON.stringify({
            error: "Usage limit exceeded",
            code: "USAGE_LIMIT_EXCEEDED",
            message: "오늘의 무료 사용량을 모두 사용했습니다. Premium으로 업그레이드하세요.",
            usageStatus,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const { messages: userMessages, chatId, mode, mood } = await req.json();

    // Diary context (simplified from business context)
    const diaryContext = { mode: mode || "diary" };

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
          userId: userId,
          title: lastUserMessage.content.substring(0, 50),
        })
        .returning();

      currentChatId = newChat.id;
    }

    console.log("[API] Processing message for chat:", currentChatId, "User:", userId);

    // Initialize or get user profile
    const userProfile = await getOrCreateUserProfile(userId);
    const explanationStyle = getExplanationStyle(userProfile);
    console.log("[API] User profile loaded:", {
      explanationStyle,
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

    // Initialize graph
    const tutorGraph = new EnglishTutorGraph();
    const graph = tutorGraph.getGraph();

    // Prepare initial state
    const initialState = {
      messages: langchainMessages,
      summary: "", // v3.0: Summary feature removed
      userProfile: Array.isArray(userProfile.recurringMistakes)
        ? userProfile.recurringMistakes
        : [],
      messageCount: langchainMessages.length,
      chatId: currentChatId,
      userId: userId,
      correctionResult: null,
      diaryContext,
    };

    // Invoke graph
    console.log("[API] Invoking LangGraph...");

    const result = await graph.invoke(initialState);

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

      // Save assistant message (as JSON string) with mood if provided
      const assistantContent = mood
        ? { ...correctionResult, mood }
        : correctionResult;
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "assistant",
        content: JSON.stringify(assistantContent),
      });

      console.log("[API] Messages saved to database");
    } catch (error) {
      console.error("[DB Error] Failed to save messages:", error);
    }

    // Increment usage and update streak for authenticated users
    if (isAuthenticated) {
      try {
        const newCount = await incrementUsage(userId);
        console.log(`[API] Usage incremented for user ${userId}: ${newCount}`);

        // Record diary entry and update streak
        const streakInfo = await recordDiaryEntry(userId);
        console.log(`[API] Streak updated for user ${userId}: ${streakInfo.currentStreak} days`);
      } catch (error) {
        console.error("[API] Failed to update usage/streak:", error);
        // Don't fail the request if tracking fails
      }
    }

    // Grant XP for diary submission (authenticated users only)
    const xpResults: Array<{action: string; xpGained: number; leveledUp: boolean; newLevel?: number}> = [];
    if (isAuthenticated) {
      try {
        // 1. Base XP: diary_submit (+30 XP)
        const diaryXp = await grantXp(userId, "diary_submit", currentChatId);
        console.log(`[API] XP granted for diary_submit: +${diaryXp.xpGained} XP (total: ${diaryXp.totalXp})`);
        xpResults.push({
          action: "diary_submit",
          xpGained: diaryXp.xpGained,
          leveledUp: diaryXp.leveledUp,
          newLevel: diaryXp.newLevel,
        });

        // 2. Challenge word bonus (+15 XP if used)
        if (mood || correctionResult?.challengeWordUsed) {
          const challengeXp = await grantXp(userId, "challenge_word", currentChatId);
          console.log(`[API] XP granted for challenge_word: +${challengeXp.xpGained} XP`);
          xpResults.push({
            action: "challenge_word",
            xpGained: challengeXp.xpGained,
            leveledUp: challengeXp.leveledUp,
            newLevel: challengeXp.newLevel,
          });
        }

        // 3. Perfect diary bonus (+20 XP if no mistakes)
        if (correctionResult && !correctionResult.mistakeType) {
          const perfectXp = await grantXp(userId, "perfect_diary", currentChatId);
          console.log(`[API] XP granted for perfect_diary: +${perfectXp.xpGained} XP`);
          xpResults.push({
            action: "perfect_diary",
            xpGained: perfectXp.xpGained,
            leveledUp: perfectXp.leveledUp,
            newLevel: perfectXp.newLevel,
          });
        }
      } catch (error) {
        console.error("[API] Failed to grant XP:", error);
        // Don't fail the request if XP tracking fails (non-blocking)
      }
    }

    // Save mistake pattern to database if detected
    if (correctionResult?.mistakeType && correctionResult?.mistakePattern) {
      try {
        await saveOrUpdateMistake(
          userId,
          correctionResult.mistakeType,
          correctionResult.mistakePattern,
          correctionResult.originalText || ""
        );
        console.log(
          `[API] Mistake pattern saved: ${correctionResult.mistakeType} - ${correctionResult.mistakePattern}`
        );

        // Check for recurring patterns and generate insight
        const recurringMistake = await checkRecurringPattern(
          userId,
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

    // Return the correction result (include mood and XP results if provided)
    const responseObject = {
      ...correctionResult,
      ...(mood && { mood }),
      ...(xpResults.length > 0 && { xpResults }),
    };
    return Response.json(
      { object: responseObject },
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
