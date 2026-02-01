import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { openTreasureChest } from "@/lib/gamification/treasure-chest";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/treasure-chest/open-with-key
 * Open treasure chest with a key (IAP item)
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userProfile = profile[0];

    // Check if user has keys
    if (userProfile.chestKeyCount <= 0) {
      return NextResponse.json(
        { error: "No chest keys available" },
        { status: 400 }
      );
    }

    // Consume one key
    await db
      .update(userProfiles)
      .set({
        chestKeyCount: userProfile.chestKeyCount - 1,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));

    // Open chest
    const reward = await openTreasureChest(userId, "key");

    return NextResponse.json({
      success: true,
      reward,
      remainingKeys: userProfile.chestKeyCount - 1,
    });
  } catch (error) {
    console.error("[Treasure Chest Key API] Error:", error);
    return NextResponse.json(
      { error: "Failed to open treasure chest with key" },
      { status: 500 }
    );
  }
}
