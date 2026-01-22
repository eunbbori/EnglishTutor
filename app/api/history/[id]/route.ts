import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, and } from "drizzle-orm";

export interface DiaryEntryDetail {
  id: string;
  chatId: string;
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  alternatives: Array<{ type: string; text: string }>;
  mistakeType?: string | null;
  insight?: string;
  createdAt: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: chatId } = await params;

    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the chat belongs to the user
    const chat = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .limit(1);

    if (chat.length === 0) {
      return Response.json(
        { error: "Diary entry not found" },
        { status: 404 }
      );
    }

    // Get messages for this chat
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt));

    const userMsg = chatMessages.find((m) => m.role === "user");
    const assistantMsg = chatMessages.find((m) => m.role === "assistant");

    if (!userMsg || !assistantMsg) {
      return Response.json(
        { error: "Diary entry incomplete" },
        { status: 404 }
      );
    }

    let entry: DiaryEntryDetail;

    try {
      const correctionData = JSON.parse(assistantMsg.content);
      entry = {
        id: userMsg.id,
        chatId: chat[0].id,
        originalText: correctionData.originalText || userMsg.content,
        correctedText: correctionData.correctedText || "",
        koreanExplanation: correctionData.koreanExplanation || "",
        alternatives: correctionData.alternatives || [],
        mistakeType: correctionData.mistakeType,
        insight: correctionData.insight,
        createdAt: userMsg.createdAt.toISOString(),
      };
    } catch {
      // Fallback if JSON parsing fails
      entry = {
        id: userMsg.id,
        chatId: chat[0].id,
        originalText: userMsg.content,
        correctedText: "",
        koreanExplanation: "",
        alternatives: [],
        createdAt: userMsg.createdAt.toISOString(),
      };
    }

    return Response.json({ entry });
  } catch (error) {
    console.error("[History Detail API Error]", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch diary entry" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
