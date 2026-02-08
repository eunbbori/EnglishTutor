import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserXpStatus } from "@/lib/gamification/xp-service";
import { getXpProgress, getXpForNextLevel, getTitleForLevel } from "@/lib/gamification/xp-constants";
import { getPotentialLevelInfo } from "@/lib/xp/level-rewards";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_USER_ID = "default-user";

/**
 * GET /api/user/xp
 * Retrieve user's XP status including level, title, progress
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || DEFAULT_USER_ID;

    console.log("[XP API] GET request - Fetching XP status for user:", userId);

    // Get XP status
    const xpStatus = await getUserXpStatus(userId);

    // Calculate progress to next level
    const progress = getXpProgress(xpStatus.xp, xpStatus.level);
    const nextLevelXp = getXpForNextLevel(xpStatus.level);

    // Check if booster is active
    const boosterActive = xpStatus.boosterExpiresAt
      ? new Date() < new Date(xpStatus.boosterExpiresAt)
      : false;

    // v3.1.1: Check premium status and get potential level info
    let isPremium = false;
    if (userId !== DEFAULT_USER_ID) {
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

      isPremium = subscription.length > 0;
    }

    const potentialInfo = getPotentialLevelInfo(xpStatus.xp, isPremium);

    return NextResponse.json({
      success: true,
      data: {
        xp: xpStatus.xp,
        level: xpStatus.level,
        title: xpStatus.title,
        equippedTitle: xpStatus.equippedTitle,
        earnedTitles: xpStatus.earnedTitles,
        progress: {
          current: progress.current,
          required: progress.required,
          percentage: progress.percentage,
          nextLevelXp,
        },
        booster: {
          active: boosterActive,
          expiresAt: xpStatus.boosterExpiresAt,
        },
        // v3.1.1: Potential level info
        isPremium,
        potentialLevel: potentialInfo.showPotential ? {
          level: potentialInfo.potentialLevel,
          title: getTitleForLevel(potentialInfo.potentialLevel),
          gap: potentialInfo.levelGap,
        } : null,
      },
    });
  } catch (error) {
    console.error("[XP API] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch XP status",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
