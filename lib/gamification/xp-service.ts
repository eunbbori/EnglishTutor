/**
 * XP Service
 * v3.0: Handles XP granting, level calculation, and user profile updates
 */

import { db } from "@/db";
import { userProfiles, xpHistory, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  XpAction,
  XP_REWARDS,
  calculateLevel,
  getTitleForLevel,
  checkLevelUp,
  FREE_LEVEL_CAP,
} from "./xp-constants";

/**
 * XP Grant Result
 */
export interface XpGrantResult {
  xpGained: number;       // Actual XP gained (with booster if applicable)
  totalXp: number;        // User's new total XP
  oldLevel: number;       // Level before grant
  newLevel: number;       // Level after grant
  leveledUp: boolean;     // Whether a level-up occurred
  newTitle?: string;      // New title if leveled up
  boosterApplied: boolean; // Whether XP 2x booster was active
  cappedAtFreeLimit: boolean; // Whether level was capped at Lv.10 (free user)
}

/**
 * Check if user is premium
 * @param userId - User ID
 * @returns Whether user has active premium subscription
 */
async function isPremiumUser(userId: string): Promise<boolean> {
  try {
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

    return subscription.length > 0;
  } catch (error) {
    console.error("[XP Service] Error checking premium status:", error);
    return false;
  }
}

/**
 * Check if XP booster is active
 * @param userId - User ID
 * @returns Whether XP 2x booster is currently active
 */
async function hasActiveBooster(userId: string): Promise<boolean> {
  try {
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return false;
    }

    const expiresAt = profile[0].xpBoosterExpiresAt;
    if (!expiresAt) {
      return false;
    }

    return new Date() < new Date(expiresAt);
  } catch (error) {
    console.error("[XP Service] Error checking booster status:", error);
    return false;
  }
}

/**
 * Grant XP to a user
 * @param userId - User ID
 * @param action - XP action type
 * @param referenceId - Optional reference ID (chat_id, quest_id, etc.)
 * @returns XP grant result
 */
export async function grantXp(
  userId: string,
  action: XpAction,
  referenceId?: string
): Promise<XpGrantResult> {
  try {
    // Get base XP amount for this action
    const baseXp = XP_REWARDS[action];
    if (baseXp === undefined) {
      throw new Error(`Invalid XP action: ${action}`);
    }

    // Check booster status
    const boosterActive = await hasActiveBooster(userId);
    const xpGained = boosterActive ? baseXp * 2 : baseXp;

    // Check premium status
    const isPremium = await isPremiumUser(userId);

    // Get or create user profile
    let profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // Create profile if doesn't exist
      const [newProfile] = await db
        .insert(userProfiles)
        .values({
          userId,
          learningGoal: null,
          recurringMistakes: [],
          learningPreferences: { explanation_style: "detailed" },
          xp: 0,
          xpLevel: 1,
          title: "Diary Beginner",
          equippedTitle: null,
          earnedTitles: [],
          streakFreezeCount: 0,
          xpBoosterExpiresAt: null,
          chestKeyCount: 0,
        })
        .returning();

      profile = [newProfile];
    }

    const currentProfile = profile[0];
    const oldXp = currentProfile.xp;
    const newXp = oldXp + xpGained;

    // Calculate levels
    const oldLevel = calculateLevel(oldXp, isPremium);
    const newLevel = calculateLevel(newXp, isPremium);

    // Check if level-up occurred
    const levelUp = checkLevelUp(oldXp, newXp, isPremium);
    const leveledUp = levelUp !== null;
    const newTitle = leveledUp ? levelUp.newTitle : currentProfile.title;

    // Add earned title if new level reached
    const currentTitles = Array.isArray(currentProfile.earnedTitles)
      ? (currentProfile.earnedTitles as string[])
      : [];

    const updatedTitles = leveledUp && newTitle && !currentTitles.includes(newTitle)
      ? [...currentTitles, newTitle]
      : currentTitles;

    // Determine if capped at free limit
    const cappedAtFreeLimit = !isPremium && newLevel === FREE_LEVEL_CAP && calculateLevel(newXp, true) > FREE_LEVEL_CAP;

    // Note: neon-http driver doesn't support transactions
    // Execute sequentially instead of transaction
    try {
      // 1. Update user profile
      await db
        .update(userProfiles)
        .set({
          xp: newXp,
          xpLevel: newLevel,
          title: newTitle,
          earnedTitles: updatedTitles,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));

      // 2. Insert XP history record
      await db.insert(xpHistory).values({
        userId,
        amount: xpGained,
        action,
        boosterApplied: boosterActive,
        referenceId: referenceId || null,
      });
    } catch (dbError) {
      console.error("[XP Service] ✗ Database operation failed:", dbError);
      throw dbError;
    }

    console.log(
      `[XP Service] ✓ Granted ${xpGained} XP to user ${userId} for action '${action}' (${oldLevel} → ${newLevel}${cappedAtFreeLimit ? ' [capped]' : ''})`
    );

    if (leveledUp && levelUp) {
      console.log(
        `[XP Service] 🎉 Level up! ${levelUp.oldLevel} → ${levelUp.newLevel} (${levelUp.newTitle})`
      );
    }

    return {
      xpGained,
      totalXp: newXp,
      oldLevel,
      newLevel,
      leveledUp,
      newTitle: leveledUp ? newTitle : undefined,
      boosterApplied: boosterActive,
      cappedAtFreeLimit,
    };
  } catch (error) {
    console.error("[XP Service] ✗ Error granting XP:", error);
    throw error;
  }
}

/**
 * Get user's current XP status
 * @param userId - User ID
 * @returns XP status including level, title, progress
 */
export async function getUserXpStatus(userId: string) {
  try {
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // Return defaults for new users
      return {
        xp: 0,
        level: 1,
        title: "Diary Beginner",
        equippedTitle: null,
        earnedTitles: [],
        boosterExpiresAt: null,
      };
    }

    const p = profile[0];
    return {
      xp: p.xp,
      level: p.xpLevel,
      title: p.title,
      equippedTitle: p.equippedTitle,
      earnedTitles: Array.isArray(p.earnedTitles) ? p.earnedTitles : [],
      boosterExpiresAt: p.xpBoosterExpiresAt,
    };
  } catch (error) {
    console.error("[XP Service] ✗ Error getting XP status:", error);
    throw error;
  }
}

/**
 * Activate XP 2x booster for a user
 * @param userId - User ID
 * @param durationHours - Booster duration in hours (default 24)
 */
export async function activateXpBooster(userId: string, durationHours: number = 24) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    await db
      .update(userProfiles)
      .set({
        xpBoosterExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));

    console.log(`[XP Service] ✓ Activated XP 2x booster for user ${userId} (expires: ${expiresAt.toISOString()})`);

    return { expiresAt };
  } catch (error) {
    console.error("[XP Service] ✗ Error activating booster:", error);
    throw error;
  }
}
