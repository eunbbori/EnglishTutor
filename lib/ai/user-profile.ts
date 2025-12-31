import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Represents a recurring mistake pattern
 */
export interface RecurringMistake {
  pattern: string; // e.g., "subject-verb agreement", "article usage"
  examples: string[]; // Examples of the mistake
  count: number; // Number of times this mistake was made
  lastSeen: string; // ISO timestamp
}

/**
 * User learning preferences
 */
export interface LearningPreferences {
  preferredExplanationStyle?: "detailed" | "concise";
  focusAreas?: string[]; // e.g., ["grammar", "idioms", "business-english"]
}

/**
 * User Profile Manager
 * Manages user's recurring mistake patterns (Fact Memory / Singleton)
 * This data persists across all conversations
 */
export class UserProfileManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get or create user profile
   */
  async getProfile() {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, this.userId))
      .limit(1);

    if (profile) {
      return {
        id: profile.id,
        userId: profile.userId,
        recurringMistakes: profile.recurringMistakes as RecurringMistake[],
        learningPreferences: profile.learningPreferences as LearningPreferences,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    }

    // Create new profile if doesn't exist
    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        userId: this.userId,
        recurringMistakes: [],
        learningPreferences: {},
      })
      .returning();

    return {
      id: newProfile.id,
      userId: newProfile.userId,
      recurringMistakes: newProfile.recurringMistakes as RecurringMistake[],
      learningPreferences: newProfile.learningPreferences as LearningPreferences,
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
    };
  }

  /**
   * Add or update a recurring mistake
   */
  async addRecurringMistake(pattern: string, example: string) {
    const profile = await this.getProfile();
    const mistakes = profile.recurringMistakes;

    const existingMistakeIndex = mistakes.findIndex((m) => m.pattern === pattern);

    if (existingMistakeIndex >= 0) {
      // Update existing mistake
      const existing = mistakes[existingMistakeIndex];
      mistakes[existingMistakeIndex] = {
        ...existing,
        examples: [...new Set([...existing.examples, example])].slice(-5), // Keep last 5 unique examples
        count: existing.count + 1,
        lastSeen: new Date().toISOString(),
      };
    } else {
      // Add new mistake
      mistakes.push({
        pattern,
        examples: [example],
        count: 1,
        lastSeen: new Date().toISOString(),
      });
    }

    // Update database
    await db
      .update(userProfiles)
      .set({
        recurringMistakes: mistakes as any,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, this.userId));

    return mistakes;
  }

  /**
   * Get recurring mistakes summary for LLM context
   */
  async getRecurringMistakesSummary(): Promise<string> {
    const profile = await this.getProfile();
    const mistakes = profile.recurringMistakes;

    if (mistakes.length === 0) {
      return "No recurring mistakes recorded yet.";
    }

    // Sort by count (most frequent first)
    const sorted = [...mistakes].sort((a, b) => b.count - a.count);

    const summary = sorted
      .slice(0, 5) // Top 5 mistakes
      .map(
        (m, i) =>
          `${i + 1}. ${m.pattern} (${m.count}x): Examples: ${m.examples.slice(0, 2).join(", ")}`
      )
      .join("\n");

    return `User's recurring mistakes:\n${summary}`;
  }

  /**
   * Update learning preferences
   */
  async updatePreferences(preferences: Partial<LearningPreferences>) {
    const profile = await this.getProfile();

    const updatedPreferences = {
      ...profile.learningPreferences,
      ...preferences,
    };

    await db
      .update(userProfiles)
      .set({
        learningPreferences: updatedPreferences as any,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, this.userId));

    return updatedPreferences;
  }
}
