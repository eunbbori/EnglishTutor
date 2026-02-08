/**
 * Level Milestone Rewards
 * v3.1.1: Lv.10 special rewards and trial system
 */

import { db } from "@/db";
import { subscriptions, userProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { FREE_LEVEL_CAP } from "@/lib/gamification/xp-constants";

/**
 * Check if user has already claimed Lv.10 trial
 *
 * @param userId - User ID
 * @returns True if trial was already claimed
 */
async function hasClaimedLv10Trial(userId: string): Promise<boolean> {
  // Check user_profiles for a flag
  // We'll use learningPreferences.lv10_trial_claimed
  const profile = await db
    .select({
      preferences: userProfiles.learningPreferences,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length === 0) {
    return false;
  }

  const prefs = profile[0].preferences as Record<string, any>;
  return prefs?.lv10_trial_claimed === true;
}

/**
 * Mark Lv.10 trial as claimed
 *
 * @param userId - User ID
 */
async function markLv10TrialClaimed(userId: string): Promise<void> {
  // Update learningPreferences to include lv10_trial_claimed flag
  const profile = await db
    .select({
      preferences: userProfiles.learningPreferences,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length === 0) {
    return;
  }

  const prefs = profile[0].preferences as Record<string, any>;
  const updatedPrefs = {
    ...prefs,
    lv10_trial_claimed: true,
  };

  await db
    .update(userProfiles)
    .set({
      learningPreferences: updatedPrefs,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));
}

/**
 * Grant 3-day premium trial on Lv.10 achievement
 * Only granted once per account
 *
 * @param userId - User ID
 * @param currentLevel - User's current level
 * @returns True if trial was granted, false if already claimed or not eligible
 */
export async function checkAndGrantLv10Trial(
  userId: string,
  currentLevel: number
): Promise<boolean> {
  // Only trigger if user just reached Lv.10
  if (currentLevel !== FREE_LEVEL_CAP) {
    return false;
  }

  // Check if already claimed
  const alreadyClaimed = await hasClaimedLv10Trial(userId);
  if (alreadyClaimed) {
    return false;
  }

  // Check if user is already premium
  const existingSubscription = await db
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

  if (existingSubscription.length > 0) {
    // User is already premium, no need for trial
    await markLv10TrialClaimed(userId);
    return false;
  }

  // Grant 3-day trial
  try {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

    await db.insert(subscriptions).values({
      userId,
      plan: "premium",
      status: "active",
      paymentKey: null, // No payment for trial
      startDate: now,
      endDate: trialEnd,
    });

    await markLv10TrialClaimed(userId);

    console.log(
      `[Lv.10 Trial] ✓ Granted 3-day premium trial to user ${userId} (expires: ${trialEnd.toISOString()})`
    );

    return true;
  } catch (error) {
    console.error("[Lv.10 Trial] ✗ Error granting trial:", error);
    return false;
  }
}

/**
 * Get potential level for free user (what level they'd be with premium)
 *
 * @param currentXp - User's current XP
 * @param isPremium - Whether user is premium
 * @returns Potential level info
 */
export function getPotentialLevelInfo(
  currentXp: number,
  isPremium: boolean
): {
  currentLevel: number;
  potentialLevel: number;
  showPotential: boolean;
  levelGap: number;
} {
  const { calculateLevel, calculatePotentialLevel } = require("@/lib/gamification/xp-constants");

  const currentLevel = calculateLevel(currentXp, isPremium);
  const potentialLevel = calculatePotentialLevel(currentXp);

  const showPotential =
    !isPremium &&
    currentLevel === FREE_LEVEL_CAP &&
    potentialLevel > FREE_LEVEL_CAP;

  const levelGap = potentialLevel - currentLevel;

  return {
    currentLevel,
    potentialLevel,
    showPotential,
    levelGap,
  };
}
