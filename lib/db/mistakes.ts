import { db } from "@/db";
import { userMistakes } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Parse mistakeType format "category:subcategory" to extract category
 * @param mistakeType - The mistake type string (e.g., "grammar:tense")
 * @returns The category part (e.g., "grammar")
 */
function parseMistakeCategory(mistakeType: string): string {
  const [category] = mistakeType.split(":");
  return category;
}

/**
 * Save or update a mistake pattern in the database
 * @param userId - The user ID
 * @param mistakeType - The mistake type (e.g., "grammar:tense")
 * @param pattern - The specific mistake pattern (e.g., "tense-confusion")
 * @param example - The example sentence showing the mistake
 */
export async function saveOrUpdateMistake(
  userId: string,
  mistakeType: string,
  pattern: string,
  example: string
) {
  try {
    // Extract category from mistakeType (e.g., "grammar:tense" -> "grammar")
    const category = parseMistakeCategory(mistakeType);

    // Validate category
    const validCategories = ["grammar", "vocabulary", "pronunciation", "fluency", "comprehension"];
    if (!validCategories.includes(category)) {
      console.warn(`[Mistakes] Invalid category: ${category}, defaulting to 'grammar'`);
    }

    // Check if this pattern already exists for this user
    const existingMistakes = await db
      .select()
      .from(userMistakes)
      .where(
        and(
          eq(userMistakes.userId, userId),
          eq(userMistakes.pattern, pattern)
        )
      )
      .limit(1);

    if (existingMistakes.length > 0) {
      // Update existing record: increment frequency and update examples
      const existing = existingMistakes[0];
      const currentExamples = Array.isArray(existing.examples) ? existing.examples : [];

      // Add new example to the beginning, keep max 5 (FIFO)
      const updatedExamples = [example, ...currentExamples].slice(0, 5);

      const [updated] = await db
        .update(userMistakes)
        .set({
          frequency: existing.frequency + 1,
          examples: updatedExamples,
          lastOccurredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMistakes.id, existing.id))
        .returning();

      console.log(
        `[Mistakes] ✓ Updated pattern '${pattern}' for user ${userId} (frequency: ${updated.frequency})`
      );
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(userMistakes)
        .values({
          userId,
          mistakeType: category as "grammar" | "vocabulary" | "pronunciation" | "fluency" | "comprehension",
          pattern,
          frequency: 1,
          examples: [example],
          lastOccurredAt: new Date(),
        })
        .returning();

      console.log(
        `[Mistakes] ✓ Created new pattern '${pattern}' for user ${userId}`
      );
      return created;
    }
  } catch (error) {
    console.error("[Mistakes] ✗ Error saving/updating mistake:", error);
    throw error;
  }
}

/**
 * Get all mistakes for a user
 * @param userId - The user ID
 * @returns Array of user mistakes
 */
export async function getUserMistakes(userId: string) {
  try {
    const mistakes = await db
      .select()
      .from(userMistakes)
      .where(eq(userMistakes.userId, userId));

    return mistakes;
  } catch (error) {
    console.error("[Mistakes] ✗ Error fetching user mistakes:", error);
    throw error;
  }
}

/**
 * Get mistakes by type for a user
 * @param userId - The user ID
 * @param mistakeType - The mistake category
 * @returns Array of user mistakes filtered by type
 */
export async function getUserMistakesByType(
  userId: string,
  mistakeType: "grammar" | "vocabulary" | "pronunciation" | "fluency" | "comprehension"
) {
  try {
    const mistakes = await db
      .select()
      .from(userMistakes)
      .where(
        and(
          eq(userMistakes.userId, userId),
          eq(userMistakes.mistakeType, mistakeType)
        )
      );

    return mistakes;
  } catch (error) {
    console.error("[Mistakes] ✗ Error fetching mistakes by type:", error);
    throw error;
  }
}

/**
 * Check if a mistake pattern is recurring (occurred 3+ times in last 7 days)
 * @param userId - The user ID
 * @param pattern - The mistake pattern to check
 * @returns The mistake record if recurring (frequency >= 3), null otherwise
 */
export async function checkRecurringPattern(userId: string, pattern: string) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mistakes = await db
      .select()
      .from(userMistakes)
      .where(
        and(
          eq(userMistakes.userId, userId),
          eq(userMistakes.pattern, pattern),
          gte(userMistakes.lastOccurredAt, sevenDaysAgo)
        )
      )
      .limit(1);

    if (mistakes.length > 0 && mistakes[0].frequency >= 3) {
      console.log(
        `[Mistakes] ⚠️  Recurring pattern detected: '${pattern}' (frequency: ${mistakes[0].frequency})`
      );
      return mistakes[0];
    }

    return null;
  } catch (error) {
    console.error("[Mistakes] ✗ Error checking recurring pattern:", error);
    throw error;
  }
}

/**
 * Get top recurring mistakes for a user (ordered by frequency)
 * @param userId - The user ID
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of top recurring mistakes
 */
export async function getTopRecurringMistakes(userId: string, limit: number = 5) {
  try {
    const mistakes = await db
      .select()
      .from(userMistakes)
      .where(eq(userMistakes.userId, userId))
      .orderBy(sql`${userMistakes.frequency} DESC`)
      .limit(limit);

    return mistakes;
  } catch (error) {
    console.error("[Mistakes] ✗ Error fetching top recurring mistakes:", error);
    throw error;
  }
}
