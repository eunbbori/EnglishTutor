import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { treasureChestLog } from "@/db/schema";
import { eq, desc, gte } from "drizzle-orm";

/**
 * GET /api/treasure-chest/history
 * Get treasure chest reward history (last 7 days)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get rewards from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rewards = await db
      .select()
      .from(treasureChestLog)
      .where(eq(treasureChestLog.userId, userId))
      .orderBy(desc(treasureChestLog.createdAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      rewards,
    });
  } catch (error) {
    console.error("[Treasure Chest History API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward history" },
      { status: 500 }
    );
  }
}
