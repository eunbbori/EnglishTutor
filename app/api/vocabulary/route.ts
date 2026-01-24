import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/vocabulary - Get user's vocabulary list
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const words = await db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.userId, session.user.id))
      .orderBy(desc(vocabulary.createdAt));

    return NextResponse.json({ words });
  } catch (error) {
    console.error("[Vocabulary API] Error fetching vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}

// POST /api/vocabulary - Save a new word
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { word, meaning, example, memo, sourceType, sourceId } = body;

    if (!word || word.trim().length === 0) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const [newWord] = await db
      .insert(vocabulary)
      .values({
        userId: session.user.id,
        word: word.trim(),
        meaning: meaning?.trim() || null,
        example: example?.trim() || null,
        memo: memo?.trim() || null,
        sourceType: sourceType || "manual",
        sourceId: sourceId || null,
      })
      .returning();

    return NextResponse.json({ word: newWord }, { status: 201 });
  } catch (error) {
    console.error("[Vocabulary API] Error saving word:", error);
    return NextResponse.json(
      { error: "Failed to save word" },
      { status: 500 }
    );
  }
}
