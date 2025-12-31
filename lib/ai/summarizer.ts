import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Message representation for summarization
 */
interface MessageForSummary {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

/**
 * Conversation Summarizer
 * Compacts old messages using LLM when conversation exceeds threshold
 * Removes tool results and unnecessary data to save memory
 */
export class ConversationSummarizer {
  private model: ChatGoogleGenerativeAI;
  private messageThreshold: number;

  constructor(messageThreshold = 5) {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      temperature: 0.3,
    });
    this.messageThreshold = messageThreshold;
  }

  /**
   * Check if summarization is needed based on message count
   */
  shouldSummarize(messageCount: number): boolean {
    return messageCount > this.messageThreshold;
  }

  /**
   * Summarize a list of messages
   * Keeps important corrections and learning points while reducing verbosity
   */
  async summarizeMessages(messages: MessageForSummary[]): Promise<string> {
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Tutor"}: ${m.content}`)
      .join("\n\n");

    const summaryPrompt = `You are summarizing a conversation between an English tutor and a student.

Conversation to summarize:
${conversationText}

Create a concise summary that:
1. Captures the main topics discussed
2. Lists key corrections made by the tutor
3. Highlights recurring mistakes or patterns
4. Preserves important grammar rules explained

Keep the summary under 200 words. Write in Korean for explanations.`;

    try {
      const response = await this.model.invoke([new HumanMessage(summaryPrompt)]);
      return response.content as string;
    } catch (error) {
      console.error("[Summarizer] Error generating summary:", error);
      // Fallback to simple summary
      return `대화 ${messages.length}개 메시지 요약: ${messages
        .slice(0, 2)
        .map((m) => m.content.substring(0, 50))
        .join(", ")}...`;
    }
  }

  /**
   * Compact messages by summarizing old ones and keeping recent ones
   * Returns: { summary, recentMessages }
   */
  async compactMessages(
    allMessages: MessageForSummary[],
    keepRecentCount = 3
  ): Promise<{
    summary: string;
    recentMessages: MessageForSummary[];
  }> {
    if (allMessages.length <= this.messageThreshold) {
      return {
        summary: "",
        recentMessages: allMessages,
      };
    }

    // Split messages into old (to summarize) and recent (to keep)
    const splitPoint = allMessages.length - keepRecentCount;
    const oldMessages = allMessages.slice(0, splitPoint);
    const recentMessages = allMessages.slice(splitPoint);

    const summary = await this.summarizeMessages(oldMessages);

    return {
      summary,
      recentMessages,
    };
  }

  /**
   * Update chat summary in database
   */
  async updateChatSummary(chatId: string, summary: string): Promise<void> {
    try {
      await db
        .update(chats)
        .set({
          summary,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, chatId));
    } catch (error) {
      console.error("[Summarizer] Error updating chat summary:", error);
    }
  }

  /**
   * Clean tool results and metadata from messages
   * Keeps only essential user/assistant content
   */
  cleanMessages(messages: BaseMessage[]): MessageForSummary[] {
    return messages
      .filter((m) => {
        // Handle both BaseMessage objects and plain objects
        const type = typeof m._getType === 'function' ? m._getType() : (m as any).constructor?.name?.toLowerCase();
        return type === "human" || type === "ai" || type === "humanmessage" || type === "aimessage";
      })
      .map((m) => {
        const type = typeof m._getType === 'function' ? m._getType() : (m as any).constructor?.name?.toLowerCase();
        const isHuman = type === "human" || type === "humanmessage";

        return {
          role: isHuman ? "user" : "assistant",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        };
      });
  }

  /**
   * Get existing summary from database
   */
  async getChatSummary(chatId: string): Promise<string | null> {
    try {
      const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);

      return chat?.summary || null;
    } catch (error) {
      console.error("[Summarizer] Error getting chat summary:", error);
      return null;
    }
  }
}
