import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// DELETE /api/vocabulary/[id] - Delete a word
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete only if the word belongs to the user
    const result = await db
      .delete(vocabulary)
      .where(
        and(eq(vocabulary.id, id), eq(vocabulary.userId, session.user.id))
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vocabulary API] Error deleting word:", error);
    return NextResponse.json(
      { error: "Failed to delete word" },
      { status: 500 }
    );
  }
}

// PATCH /api/vocabulary/[id] - Update a word
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { word, meaning, example, memo } = body;

    // Update only if the word belongs to the user
    const [updatedWord] = await db
      .update(vocabulary)
      .set({
        word: word?.trim(),
        meaning: meaning?.trim() || null,
        example: example?.trim() || null,
        memo: memo?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(vocabulary.id, id), eq(vocabulary.userId, session.user.id))
      )
      .returning();

    if (!updatedWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json({ word: updatedWord });
  } catch (error) {
    console.error("[Vocabulary API] Error updating word:", error);
    return NextResponse.json(
      { error: "Failed to update word" },
      { status: 500 }
    );
  }
}
