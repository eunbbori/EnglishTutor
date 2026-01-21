import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";

export interface DiaryEntry {
  id: string;
  chatId: string;
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  createdAt: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({
        entries: [],
        isGuest: true,
      });
    }

    const userId = session.user.id;

    // Get user's chats
    const userChats = await db
      .select({
        id: chats.id,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.createdAt))
      .limit(50);

    if (userChats.length === 0) {
      return Response.json({
        entries: [],
        isGuest: false,
      });
    }

    // Get messages for each chat
    const entries: DiaryEntry[] = [];

    for (const chat of userChats) {
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(10);

      // Group user and assistant messages
      for (let i = 0; i < chatMessages.length - 1; i++) {
        const userMsg = chatMessages.find(
          (m) => m.role === "user"
        );
        const assistantMsg = chatMessages.find(
          (m) => m.role === "assistant"
        );

        if (userMsg && assistantMsg) {
          try {
            const correctionData = JSON.parse(assistantMsg.content);
            entries.push({
              id: userMsg.id,
              chatId: chat.id,
              originalText: correctionData.originalText || userMsg.content,
              correctedText: correctionData.correctedText || "",
              koreanExplanation: correctionData.koreanExplanation || "",
              createdAt: userMsg.createdAt.toISOString(),
            });
          } catch {
            // Skip if JSON parsing fails
          }
        }
        break; // Only get the first exchange per chat
      }
    }

    return Response.json({
      entries,
      isGuest: false,
    });
  } catch (error) {
    console.error("[History API Error]", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
