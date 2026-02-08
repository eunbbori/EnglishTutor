import { db } from "@/db";
import { diaryStreaks, userProfiles, xpHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { grantXp } from "@/lib/gamification/xp-service";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWrittenAt: string | null;
  totalEntries: number;
  wroteToday: boolean;
  freezeCount: number;
  freezeUsedToday: boolean;
  comebackStatus: {
    isComeback: boolean;
    comebackDays: number;
    previousStreak: number;
  };
  welcomeBackBonus: boolean;
}

/**
 * Get today's date as YYYY-MM-DD string (in KST timezone)
 */
function getTodayKST(): string {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
  return kstTime.toISOString().split("T")[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string (in KST timezone)
 */
function getYesterdayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
  kstTime.setDate(kstTime.getDate() - 1);
  return kstTime.toISOString().split("T")[0];
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get user's Freeze count from profile
 */
async function getFreezeCount(userId: string): Promise<number> {
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return profile.length > 0 ? profile[0].streakFreezeCount : 0;
}

/**
 * Decrement user's Freeze count
 */
async function consumeFreeze(userId: string): Promise<void> {
  // Get current count
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length > 0 && profile[0].streakFreezeCount > 0) {
    await db
      .update(userProfiles)
      .set({
        streakFreezeCount: profile[0].streakFreezeCount - 1,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
  }
}

/**
 * Get or create streak record for a user
 */
export async function getOrCreateStreak(userId: string): Promise<StreakInfo> {
  // Try to find existing streak record
  const existing = await db
    .select()
    .from(diaryStreaks)
    .where(eq(diaryStreaks.userId, userId))
    .limit(1);

  const today = getTodayKST();
  const freezeCount = await getFreezeCount(userId);

  if (existing.length === 0) {
    // Create new streak record
    await db
      .insert(diaryStreaks)
      .values({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalEntries: 0,
        previousStreak: 0,
        comebackDays: 0,
      });

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWrittenAt: null,
      totalEntries: 0,
      wroteToday: false,
      freezeCount,
      freezeUsedToday: false,
      comebackStatus: {
        isComeback: false,
        comebackDays: 0,
        previousStreak: 0,
      },
      welcomeBackBonus: false,
    };
  }

  const streak = existing[0];
  const wroteToday = streak.lastWrittenAt === today;
  const freezeUsedToday = streak.streakFreezeUsedAt === today;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastWrittenAt: streak.lastWrittenAt,
    totalEntries: streak.totalEntries,
    wroteToday,
    freezeCount,
    freezeUsedToday,
    comebackStatus: {
      isComeback: !!streak.comebackStartedAt,
      comebackDays: streak.comebackDays,
      previousStreak: streak.previousStreak,
    },
    welcomeBackBonus: false,
  };
}

/**
 * Record a diary entry and update streak
 */
export async function recordDiaryEntry(userId: string): Promise<StreakInfo> {
  const today = getTodayKST();
  const yesterday = getYesterdayKST();

  // Get current streak info
  const existing = await db
    .select()
    .from(diaryStreaks)
    .where(eq(diaryStreaks.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    // Create new record with first entry
    const [newStreak] = await db
      .insert(diaryStreaks)
      .values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastWrittenAt: today,
        totalEntries: 1,
        previousStreak: 0,
        comebackDays: 0,
      })
      .returning();

    const freezeCount = await getFreezeCount(userId);

    return {
      currentStreak: 1,
      longestStreak: 1,
      lastWrittenAt: today,
      totalEntries: 1,
      wroteToday: true,
      freezeCount,
      freezeUsedToday: false,
      comebackStatus: {
        isComeback: false,
        comebackDays: 0,
        previousStreak: 0,
      },
      welcomeBackBonus: false,
    };
  }

  const streak = existing[0];

  // If already wrote today, just return current streak (don't increment)
  if (streak.lastWrittenAt === today) {
    const freezeCount = await getFreezeCount(userId);
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastWrittenAt: streak.lastWrittenAt,
      totalEntries: streak.totalEntries,
      wroteToday: true,
      freezeCount,
      freezeUsedToday: streak.streakFreezeUsedAt === today,
      comebackStatus: {
        isComeback: !!streak.comebackStartedAt,
        comebackDays: streak.comebackDays,
        previousStreak: streak.previousStreak,
      },
      welcomeBackBonus: false,
    };
  }

  // Calculate gap since last entry
  const gap = streak.lastWrittenAt ? daysBetween(streak.lastWrittenAt, today) : 999;
  const freezeCount = await getFreezeCount(userId);

  // Check for Welcome Back bonus (3+ days absence)
  // v3.1.1: Only grant if previous streak was ≥3 days
  let welcomeBackBonus = false;
  if (gap >= 3 && streak.previousStreak >= 3) {
    try {
      await grantXp(userId, "welcome_back");
      welcomeBackBonus = true;
      console.log(
        `[Streak] ✓ Welcome Back bonus! +50 XP for ${gap}-day absence (previous streak: ${streak.previousStreak} days)`
      );
    } catch (error) {
      console.error("[Streak] Failed to grant Welcome Back XP:", error);
    }
  } else if (gap >= 3 && streak.previousStreak < 3) {
    console.log(
      `[Streak] Welcome Back not granted (previous streak was only ${streak.previousStreak} days, need ≥3)`
    );
  }

  let newCurrentStreak: number;
  let previousStreak = streak.previousStreak;
  let comebackStartedAt = streak.comebackStartedAt;
  let comebackDays = streak.comebackDays;
  let freezeUsedAt = streak.streakFreezeUsedAt;

  // Determine streak continuation or reset
  if (streak.lastWrittenAt === yesterday) {
    // ✅ Continuing streak from yesterday
    newCurrentStreak = streak.currentStreak + 1;
  } else if (gap === 2 && freezeCount > 0) {
    // ✅ Gap of 2 days (skipped yesterday) + have Freeze → consume Freeze and maintain streak
    newCurrentStreak = streak.currentStreak + 1;
    await consumeFreeze(userId);
    freezeUsedAt = yesterday; // Mark freeze as used on the skipped day
    console.log(`[Streak] 🛡️ Freeze consumed! Streak protected (${freezeCount - 1} remaining)`);
  } else {
    // ❌ Streak broken - reset to 1
    previousStreak = streak.currentStreak; // Save old streak for Comeback recovery
    newCurrentStreak = 1;
    comebackStartedAt = today; // Start tracking Comeback
    comebackDays = 1;
    console.log(`[Streak] ⚠️ Streak reset (gap: ${gap} days). Previous streak: ${previousStreak}`);
  }

  // Comeback tracking
  if (comebackStartedAt && comebackStartedAt !== today) {
    comebackDays += 1;

    // Comeback Kid bonus (3 consecutive days after reset)
    if (comebackDays === 3) {
      try {
        await grantXp(userId, "comeback_kid");
        console.log(`[Streak] 🎉 Comeback Kid! +100 XP for 3-day comeback`);
      } catch (error) {
        console.error("[Streak] Failed to grant Comeback Kid XP:", error);
      }
    }

    // Streak recovery (7 consecutive days after reset → restore 50% of previous streak)
    if (comebackDays === 7 && previousStreak > 0) {
      const recoveredStreak = Math.floor(previousStreak * 0.5);
      newCurrentStreak += recoveredStreak;
      comebackStartedAt = null; // End Comeback mode
      comebackDays = 0;
      console.log(`[Streak] 💪 Streak recovery! Restored ${recoveredStreak} days (50% of ${previousStreak})`);
    }
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
  const newTotalEntries = streak.totalEntries + 1;

  // Update streak record
  await db
    .update(diaryStreaks)
    .set({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastWrittenAt: today,
      totalEntries: newTotalEntries,
      previousStreak,
      streakFreezeUsedAt: freezeUsedAt,
      comebackStartedAt,
      comebackDays,
      updatedAt: new Date(),
    })
    .where(eq(diaryStreaks.userId, userId));

  // Check for streak milestones and grant XP (once per milestone)
  // v3.1.1: 7 tiers (7/14/30/60/100/180/365 days)
  try {
    const MILESTONES = [
      { days: 7, action: "streak_7d" as const },
      { days: 14, action: "streak_14d" as const },
      { days: 30, action: "streak_30d" as const },
      { days: 60, action: "streak_60d" as const },
      { days: 100, action: "streak_100d" as const },
      { days: 180, action: "streak_180d" as const },
      { days: 365, action: "streak_365d" as const },
    ];

    for (const milestone of MILESTONES) {
      if (newCurrentStreak === milestone.days) {
        // Check if already granted
        const existingRecord = await db
          .select()
          .from(xpHistory)
          .where(
            and(
              eq(xpHistory.userId, userId),
              eq(xpHistory.action, milestone.action)
            )
          )
          .limit(1);

        if (existingRecord.length === 0) {
          const xpResult = await grantXp(userId, milestone.action);
          console.log(
            `[Streak] ✓ ${milestone.days}-day milestone reached! Granted +${xpResult.xpGained} XP`
          );
        }
      }
    }
  } catch (error) {
    console.error("[Streak] Failed to grant milestone XP:", error);
    // Don't fail the request if XP tracking fails (non-blocking)
  }

  // Refresh freeze count after potential consumption
  const updatedFreezeCount = await getFreezeCount(userId);

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastWrittenAt: today,
    totalEntries: newTotalEntries,
    wroteToday: true,
    freezeCount: updatedFreezeCount,
    freezeUsedToday: freezeUsedAt === yesterday,
    comebackStatus: {
      isComeback: !!comebackStartedAt,
      comebackDays,
      previousStreak,
    },
    welcomeBackBonus,
  };
}
