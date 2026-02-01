import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { openTreasureChest, canOpenDailyChest } from "@/lib/gamification/treasure-chest";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/treasure-chest/open
 * Open daily treasure chest (Premium only)
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is premium
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.plan, "premium"),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }

    // Check if already opened today
    const canOpen = await canOpenDailyChest(userId);
    if (!canOpen) {
      return NextResponse.json(
        { error: "Already opened today" },
        { status: 400 }
      );
    }

    // Open chest
    const reward = await openTreasureChest(userId, "daily");

    return NextResponse.json({
      success: true,
      reward,
    });
  } catch (error) {
    console.error("[Treasure Chest API] Error:", error);
    return NextResponse.json(
      { error: "Failed to open treasure chest" },
      { status: 500 }
    );
  }
}
