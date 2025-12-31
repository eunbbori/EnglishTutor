import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get existing user profile or create a new one if it doesn't exist
 * @param userId - The user ID to lookup/create profile for
 * @returns The user profile record
 */
export async function getOrCreateUserProfile(userId: string) {
  try {
    // Check if profile already exists
    const existingProfiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existingProfiles.length > 0) {
      console.log("[User Profile] Existing profile found for user:", userId);
      return existingProfiles[0];
    }

    // Create new profile with default values
    console.log("[User Profile] Creating new profile for user:", userId);

    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        userId,
        level: "detailed", // Default: detailed explanations for new users
        learningGoal: null,
        recurringMistakes: [],
        learningPreferences: {},
      })
      .returning();

    console.log("[User Profile] New profile created:", newProfile.id);
    return newProfile;
  } catch (error) {
    console.error("[User Profile Error] Failed to get/create profile:", error);
    throw error;
  }
}

/**
 * Update user profile fields
 * @param userId - The user ID
 * @param updates - Partial profile updates
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    level?: "detailed" | "concise";
    learningGoal?: string | null;
    recurringMistakes?: unknown[];
    learningPreferences?: Record<string, unknown>;
  }
) {
  try {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    console.log("[User Profile] Profile updated for user:", userId);
    return updatedProfile;
  } catch (error) {
    console.error("[User Profile Error] Failed to update profile:", error);
    throw error;
  }
}
