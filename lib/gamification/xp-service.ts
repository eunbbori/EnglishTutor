/**
 * XP Service
 * v3.1.1: Handles XP granting, level calculation, and user profile updates
 * Includes TTR validation, daily caps, and weakness overcome rewards
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
import {
  canEarnDiaryXpToday,
  incrementDiaryCount
} from "../xp/daily-tracking";
import {
  checkWeaknessOvercome,
  canEarnWeaknessOvercomeToday,
  incrementWeaknessOvercomeCount
} from "../xp/weakness-overcome";
import {
  isValidForVolumeBonus,
  getWordCount
} from "../validation/ttr";
import { checkAndGrantLv10Trial } from "../xp/level-rewards";

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

      // v3.1.1: Check for Lv.10 trial reward
      if (levelUp.newLevel === 10) {
        try {
          const trialGranted = await checkAndGrantLv10Trial(userId, levelUp.newLevel);
          if (trialGranted) {
            console.log(`[XP Service] 🎁 Lv.10 trial granted to user ${userId}`);
          }
        } catch (error) {
          console.error("[XP Service] Failed to check/grant Lv.10 trial:", error);
          // Non-blocking
        }
      }
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

/**
 * Grant diary submission XP with volume bonuses and weakness overcome check
 * v3.1.1: Includes daily caps, TTR validation, and weakness overcome logic
 *
 * @param userId - User ID
 * @param diaryText - Diary content (for word count and TTR)
 * @param mistakePattern - Mistake pattern from correction (null if no mistakes)
 * @param chatId - Chat ID for reference
 * @returns Combined XP grant result with breakdown
 */
export async function grantDiaryXp(
  userId: string,
  diaryText: string,
  mistakePattern: string | null,
  chatId?: string
): Promise<{
  totalXp: number;
  breakdown: {
    diary: number;
    volume: number;
    weakness: number;
  };
  messages: string[];
  cappedByDailyLimit: boolean;
}> {
  const breakdown = {
    diary: 0,
    volume: 0,
    weakness: 0,
  };
  const messages: string[] = [];
  let cappedByDailyLimit = false;

  try {
    // 1. Check daily cap for diary submission
    const canEarnDiary = await canEarnDiaryXpToday(userId);

    if (canEarnDiary) {
      // Grant base diary submission XP (+30 XP)
      await grantXp(userId, "diary_submit", chatId);
      breakdown.diary = XP_REWARDS.diary_submit;
      await incrementDiaryCount(userId);
      messages.push(`📝 일기 제출 +${XP_REWARDS.diary_submit} XP`);
    } else {
      // Daily cap reached
      cappedByDailyLimit = true;
      messages.push("⏰ 오늘 일기 XP는 3회까지 지급됩니다");
    }

    // 2. Volume-based bonuses (requires TTR ≥ 0.4 and within daily cap)
    // v3.1.1: Simplified to 50/100 word tiers (Issue #133)
    // Bonuses are cumulative: 100+ words grants both 50 and 100 bonuses
    if (canEarnDiary) {
      const wordCount = getWordCount(diaryText);
      const validForBonus = isValidForVolumeBonus(diaryText);

      if (validForBonus) {
        // Check each tier and grant XP (bonuses stack)
        if (wordCount >= 100) {
          // Grant both 50 and 100 word bonuses
          await grantXp(userId, "length_50", chatId);
          breakdown.volume += XP_REWARDS.length_50;
          await grantXp(userId, "length_100", chatId);
          breakdown.volume += XP_REWARDS.length_100;
          messages.push(`📏 50단어+ +${XP_REWARDS.length_50} XP`);
          messages.push(`📏 100단어+ +${XP_REWARDS.length_100} XP`);
        } else if (wordCount >= 50) {
          await grantXp(userId, "length_50", chatId);
          breakdown.volume += XP_REWARDS.length_50;
          messages.push(`📏 50단어+ +${XP_REWARDS.length_50} XP`);
        }
      } else if (wordCount >= 50) {
        // Text is long enough but TTR too low
        messages.push("💡 다양한 단어로 일기를 써보세요! (분량 보너스 미지급)");
      }
    }

    // 3. Weakness overcome bonus (daily cap: 1/day)
    const canEarnWeakness = await canEarnWeaknessOvercomeToday(userId);

    if (canEarnWeakness) {
      const overcame = await checkWeaknessOvercome(userId, mistakePattern);

      if (overcame) {
        await grantXp(userId, "weakness_overcome", chatId);
        breakdown.weakness = XP_REWARDS.weakness_overcome;
        await incrementWeaknessOvercomeCount(userId);
        messages.push(`🎉 약점 극복! +${XP_REWARDS.weakness_overcome} XP`);
      }
    }

    const totalXp = breakdown.diary + breakdown.volume + breakdown.weakness;

    console.log(
      `[Diary XP] User ${userId}: +${totalXp} XP (diary: ${breakdown.diary}, volume: ${breakdown.volume}, weakness: ${breakdown.weakness})`
    );

    return {
      totalXp,
      breakdown,
      messages,
      cappedByDailyLimit,
    };
  } catch (error) {
    console.error("[Diary XP] ✗ Error granting diary XP:", error);
    // Non-blocking: return empty result on error
    return {
      totalXp: 0,
      breakdown,
      messages: [],
      cappedByDailyLimit: false,
    };
  }
}
