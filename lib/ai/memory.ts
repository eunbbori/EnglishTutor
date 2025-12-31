import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Configuration
const RECENT_MESSAGE_LIMIT = 10; // Keep last 10 messages in context
const SUMMARY_THRESHOLD = 5; // Trigger summary after 5 conversation turns

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatHistory {
  summary: string | null;
  recentMessages: Message[];
}

/**
 * Get chat history including summary and recent messages
 */
export async function getChatHistory(chatId: string): Promise<ChatHistory> {
  // Get chat summary
  const [chat] = await db
    .select({ summary: chats.summary })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  // Get recent messages (limited to RECENT_MESSAGE_LIMIT)
  const recentMessages = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(RECENT_MESSAGE_LIMIT);

  // Reverse to chronological order
  recentMessages.reverse();

  return {
    summary: chat?.summary || null,
    recentMessages: recentMessages as Message[],
  };
}

/**
 * Update chat summary using AI to compress conversation history
 * This runs asynchronously to avoid blocking user response
 */
export async function updateChatSummary(
  chatId: string,
  shouldUpdate: boolean = false
): Promise<void> {
  try {
    // Get all messages for this chat
    const allMessages = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    // Count conversation turns (user + assistant pairs)
    const conversationTurns = Math.floor(allMessages.length / 2);

    // Only update summary if threshold is met
    if (!shouldUpdate && conversationTurns < SUMMARY_THRESHOLD) {
      return;
    }

    // Get current summary
    const [chat] = await db
      .select({ summary: chats.summary })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    const currentSummary = chat?.summary || "";

    // Prepare messages for summarization (exclude recent ones)
    const messagesToSummarize = allMessages.slice(
      0,
      Math.max(0, allMessages.length - RECENT_MESSAGE_LIMIT)
    );

    if (messagesToSummarize.length === 0 && !currentSummary) {
      return; // Nothing to summarize
    }

    // Build conversation text
    const conversationText = messagesToSummarize
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        // Parse JSON content for assistant messages
        let content = msg.content;
        if (msg.role === "assistant") {
          try {
            const parsed = JSON.parse(msg.content);
            content = `Corrected: "${parsed.correctedText}" - ${parsed.koreanExplanation}`;
          } catch {
            content = msg.content;
          }
        }
        return `${role}: ${content}`;
      })
      .join("\n");

    // Generate new summary
    const summaryPrompt = currentSummary
      ? `Previous summary: ${currentSummary}\n\nNew conversation:\n${conversationText}\n\nUpdate the summary to include both the previous context and new information. Keep it concise (max 200 words).`
      : `Summarize this conversation concisely (max 200 words):\n${conversationText}`;

    const { text: newSummary } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: summaryPrompt,
      system:
        "You are a conversation summarizer. Create concise, informative summaries that capture key points and context.",
    });

    // Update summary in database
    await db
      .update(chats)
      .set({ summary: newSummary })
      .where(eq(chats.id, chatId));

    console.log(`[Memory] Updated summary for chat ${chatId}`);
  } catch (error) {
    console.error("[Memory] Failed to update summary:", error);
    // Don't throw - this is a background task
  }
}

/**
 * Build context for AI with summary and recent messages
 */
export function buildContextWithMemory(
  summary: string | null,
  recentMessages: Message[]
): string {
  let context = "";

  if (summary) {
    context += `[Previous conversation summary]\n${summary}\n\n`;
  }

  context += "[Recent conversation]\n";
  context += recentMessages
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      let content = msg.content;

      // Parse JSON for assistant messages
      if (msg.role === "assistant") {
        try {
          const parsed = JSON.parse(msg.content);
          content = `Corrected: "${parsed.correctedText}"`;
        } catch {
          content = msg.content;
        }
      }

      return `${role}: ${content}`;
    })
    .join("\n");

  return context;
}

/**
 * Truncate messages to recent N messages only
 */
export function truncateMessages<T extends { role: string; content: string }>(
  messages: T[],
  limit: number = RECENT_MESSAGE_LIMIT
): T[] {
  if (messages.length <= limit) {
    return messages;
  }

  return messages.slice(-limit);
}
