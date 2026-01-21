import { db } from "@/db";
import { diaryStreaks } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWrittenAt: string | null;
  totalEntries: number;
  wroteToday: boolean;
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

  if (existing.length === 0) {
    // Create new streak record
    const [newStreak] = await db
      .insert(diaryStreaks)
      .values({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalEntries: 0,
      })
      .returning();

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWrittenAt: null,
      totalEntries: 0,
      wroteToday: false,
    };
  }

  const streak = existing[0];
  const wroteToday = streak.lastWrittenAt === today;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastWrittenAt: streak.lastWrittenAt,
    totalEntries: streak.totalEntries,
    wroteToday,
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
      })
      .returning();

    return {
      currentStreak: 1,
      longestStreak: 1,
      lastWrittenAt: today,
      totalEntries: 1,
      wroteToday: true,
    };
  }

  const streak = existing[0];

  // If already wrote today, just return current streak (don't increment)
  if (streak.lastWrittenAt === today) {
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastWrittenAt: streak.lastWrittenAt,
      totalEntries: streak.totalEntries,
      wroteToday: true,
    };
  }

  // Calculate new streak
  let newCurrentStreak: number;

  if (streak.lastWrittenAt === yesterday) {
    // Continuing streak from yesterday
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // Streak broken - starting fresh
    newCurrentStreak = 1;
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
      updatedAt: new Date(),
    })
    .where(eq(diaryStreaks.userId, userId));

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastWrittenAt: today,
    totalEntries: newTotalEntries,
    wroteToday: true,
  };
}
