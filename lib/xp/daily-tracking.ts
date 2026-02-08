/**
 * Daily XP Tracking Functions
 * v3.1.1: Manages daily caps for XP actions
 */

import { db } from "@/db";
import { dailyXpTracking } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { DAILY_CAPS } from "@/lib/gamification/xp-constants";

/**
 * Check if user can earn diary submission XP today
 *
 * @param userId - User ID
 * @returns True if under daily cap (3 submissions)
 */
export async function canEarnDiaryXpToday(userId: string): Promise<boolean> {
  const count = await getDiaryCountToday(userId);
  return count < DAILY_CAPS.diary_submit;
}

/**
 * Check if user can earn expression save XP today
 *
 * @param userId - User ID
 * @returns True if under daily cap (5 saves)
 */
export async function canEarnVocabXpToday(userId: string): Promise<boolean> {
  const count = await getVocabCountToday(userId);
  return count < DAILY_CAPS.expression_save;
}

/**
 * Get diary submission count for today
 *
 * @param userId - User ID
 * @returns Number of diary submissions today
 */
export async function getDiaryCountToday(userId: string): Promise<number> {
  const today = getTodayDate();

  const result = await db
    .select({ count: dailyXpTracking.diaryCount })
    .from(dailyXpTracking)
    .where(
      and(
        eq(dailyXpTracking.userId, userId),
        eq(dailyXpTracking.date, today)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].count : 0;
}

/**
 * Get vocab save count for today
 *
 * @param userId - User ID
 * @returns Number of vocab saves today
 */
export async function getVocabCountToday(userId: string): Promise<number> {
  const today = getTodayDate();

  const result = await db
    .select({ count: dailyXpTracking.vocabCount })
    .from(dailyXpTracking)
    .where(
      and(
        eq(dailyXpTracking.userId, userId),
        eq(dailyXpTracking.date, today)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].count : 0;
}

/**
 * Increment diary submission count for today
 *
 * @param userId - User ID
 */
export async function incrementDiaryCount(userId: string): Promise<void> {
  const today = getTodayDate();

  await db
    .insert(dailyXpTracking)
    .values({
      userId,
      date: today,
      diaryCount: 1,
    })
    .onConflictDoUpdate({
      target: [dailyXpTracking.userId, dailyXpTracking.date],
      set: {
        diaryCount: sql`${dailyXpTracking.diaryCount} + 1`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Increment vocab save count for today
 *
 * @param userId - User ID
 */
export async function incrementVocabCount(userId: string): Promise<void> {
  const today = getTodayDate();

  await db
    .insert(dailyXpTracking)
    .values({
      userId,
      date: today,
      vocabCount: 1,
    })
    .onConflictDoUpdate({
      target: [dailyXpTracking.userId, dailyXpTracking.date],
      set: {
        vocabCount: sql`${dailyXpTracking.vocabCount} + 1`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get today's date in YYYY-MM-DD format (KST timezone)
 *
 * @returns Today's date string
 */
function getTodayDate(): string {
  // KST = UTC+9
  const now = new Date();
  const kstOffset = 9 * 60; // 9 hours in minutes
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().split("T")[0];
}
