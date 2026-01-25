import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { enrichVocabulary } from "@/lib/ai/vocabulary-enricher";

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

// POST /api/vocabulary - Save a new word with AI enrichment
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { word, meaning, example, memo, sourceType, sourceId, context } = body;

    if (!word || word.trim().length === 0) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    // Try AI enrichment if context is provided
    let enrichedData = null;
    let enrichmentFailed = false;

    if (context && context.trim().length > 0) {
      try {
        console.log("[Vocabulary API] Attempting AI enrichment for:", word);
        enrichedData = await enrichVocabulary({
          selectedText: word.trim(),
          fullContext: context.trim(),
        });
        console.log("[Vocabulary API] AI enrichment succeeded");
      } catch (error) {
        console.error("[Vocabulary API] AI enrichment failed:", error);
        enrichmentFailed = true;
        // Continue with fallback - save without enriched data
      }
    }

    // Prepare values for insertion
    const values = {
      userId: session.user.id,
      word: word.trim(),
      meaning: enrichedData?.meaning || meaning?.trim() || null,
      example: enrichedData?.example || example?.trim() || null,
      memo: memo?.trim() || null,
      sourceType: sourceType || "manual",
      sourceId: sourceId || null,
      // AI-enriched fields
      pronunciation: enrichedData?.pronunciation || null,
      partOfSpeech: enrichedData?.partOfSpeech || null,
      synonyms: enrichedData?.synonyms || null,
      context: context?.trim() || null,
      difficulty: enrichedData?.difficulty || null,
    };

    const [newWord] = await db
      .insert(vocabulary)
      .values(values)
      .returning();

    return NextResponse.json(
      {
        word: newWord,
        enrichmentFailed, // Let client know if enrichment failed
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Vocabulary API] Error saving word:", error);
    return NextResponse.json(
      { error: "Failed to save word" },
      { status: 500 }
    );
  }
}
