import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getMonthDateRange, countWords } from "@/lib/calendar/utils";

const DEFAULT_USER_ID = "default-user";

export interface CalendarEntryData {
  chatId: string;
  mood?: string;
  keywords?: string[];
  wordCount: number;
  preview?: string;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  entries: Record<string, CalendarEntryData>; // key: "YYYY-MM-DD"
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Validate parameters
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return Response.json(
        { error: "Invalid year or month parameter" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id || DEFAULT_USER_ID;

    // Calculate date range for the month
    const { startDate, endDate } = getMonthDateRange(year, month);

    // Query chats with their messages for the given month
    const monthChats = await db
      .select({
        id: chats.id,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(
        and(
          eq(chats.userId, userId),
          gte(chats.createdAt, startDate),
          lte(chats.createdAt, endDate)
        )
      );

    // Build entries map
    const entries: Record<string, CalendarEntryData> = {};

    for (const chat of monthChats) {
      // Get messages for this chat
      const chatMessages = await db
        .select({
          role: messages.role,
          content: messages.content,
        })
        .from(messages)
        .where(eq(messages.chatId, chat.id));

      // Find user message (original text) and assistant message (correction result)
      const userMessage = chatMessages.find((m) => m.role === "user");
      const assistantMessage = chatMessages.find((m) => m.role === "assistant");

      if (!userMessage) continue;

      // Calculate word count from user's original text
      const wordCount = countWords(userMessage.content);

      // Parse assistant message to get mood and keywords
      let mood: string | undefined;
      let keywords: string[] | undefined;

      if (assistantMessage) {
        try {
          const parsed = JSON.parse(assistantMessage.content);
          mood = parsed.mood;
          keywords = parsed.keywords;
        } catch {
          // If parsing fails, skip mood/keywords
        }
      }

      // Format date key in KST (YYYY-MM-DD)
      const dateKey = formatDateToKST(chat.createdAt);

      // Store entry (if multiple entries on same day, keep the latest one)
      // Since chats are ordered by createdAt, later entries will overwrite
      entries[dateKey] = {
        chatId: chat.id,
        mood,
        keywords,
        wordCount,
        preview: userMessage.content.substring(0, 100),
      };
    }

    const result: CalendarMonthData = {
      year,
      month,
      entries,
    };

    return Response.json(result);
  } catch (error) {
    console.error("[Calendar API Error]", error);
    return Response.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

/**
 * Format Date to KST date string (YYYY-MM-DD)
 */
function formatDateToKST(date: Date): string {
  // Add 9 hours for KST offset
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split("T")[0];
}
