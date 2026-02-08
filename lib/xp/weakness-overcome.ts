/**
 * Weakness Overcome Logic
 * v3.1.1: Replaces "perfect diary" bonus with learning-oriented reward
 */

import { db } from "@/db";
import { userMistakes, dailyXpTracking } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

/**
 * Check if user has overcome their most frequent weakness
 * Compares current diary's mistake pattern against recent TOP 1 mistake
 *
 * @param userId - User ID
 * @param currentMistakePattern - Mistake pattern from current diary (null if no mistakes)
 * @returns True if weakness was overcome (eligible for +20 XP)
 */
export async function checkWeaknessOvercome(
  userId: string,
  currentMistakePattern: string | null
): Promise<boolean> {
  // If current diary has no mistakes, it's an improvement
  if (currentMistakePattern === null) {
    const hasRecentMistakes = await hasRecentTopMistake(userId);
    // Only count as overcome if user had mistakes before
    return hasRecentMistakes;
  }

  // Get recent TOP 1 mistake pattern (last 7 days, highest frequency)
  const topMistake = await getRecentTopMistake(userId);

  if (!topMistake) {
    // No recent mistakes to overcome
    return false;
  }

  // Check if current mistake pattern is different from TOP 1
  // This means user avoided their most frequent mistake
  return currentMistakePattern !== topMistake.pattern;
}

/**
 * Check if daily weakness overcome cap has been reached
 *
 * @param userId - User ID
 * @returns True if user can still earn weakness overcome bonus today
 */
export async function canEarnWeaknessOvercomeToday(
  userId: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const result = await db
    .select({
      count: dailyXpTracking.weaknessOvercomeCount,
    })
    .from(dailyXpTracking)
    .where(
      and(
        eq(dailyXpTracking.userId, userId),
        eq(dailyXpTracking.date, today)
      )
    )
    .limit(1);

  if (result.length === 0) {
    // No record yet, can earn
    return true;
  }

  // Check if count is below cap (1 per day)
  return result[0].count < 1;
}

/**
 * Increment weakness overcome count for today
 *
 * @param userId - User ID
 */
export async function incrementWeaknessOvercomeCount(
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Upsert: increment if exists, create if not
  await db
    .insert(dailyXpTracking)
    .values({
      userId,
      date: today,
      weaknessOvercomeCount: 1,
    })
    .onConflictDoUpdate({
      target: [dailyXpTracking.userId, dailyXpTracking.date],
      set: {
        weaknessOvercomeCount: sql`${dailyXpTracking.weaknessOvercomeCount} + 1`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get user's most frequent mistake pattern in the last 7 days
 *
 * @param userId - User ID
 * @returns Top mistake record or null
 */
async function getRecentTopMistake(
  userId: string
): Promise<{ pattern: string; frequency: number } | null> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await db
    .select({
      pattern: userMistakes.pattern,
      frequency: userMistakes.frequency,
    })
    .from(userMistakes)
    .where(
      and(
        eq(userMistakes.userId, userId),
        gte(userMistakes.lastOccurredAt, sevenDaysAgo)
      )
    )
    .orderBy(desc(userMistakes.frequency))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Check if user has any recent mistakes (last 7 days)
 *
 * @param userId - User ID
 * @returns True if user has mistakes in last 7 days
 */
async function hasRecentTopMistake(userId: string): Promise<boolean> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userMistakes)
    .where(
      and(
        eq(userMistakes.userId, userId),
        gte(userMistakes.lastOccurredAt, sevenDaysAgo)
      )
    );

  return result[0]?.count > 0;
}
