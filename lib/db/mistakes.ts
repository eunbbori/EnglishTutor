import { db } from "@/db";
import { userMistakes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
