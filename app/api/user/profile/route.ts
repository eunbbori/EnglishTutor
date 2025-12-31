import { NextRequest } from "next/server";
import { getOrCreateUserProfile, updateUserProfile } from "@/lib/db/user-profile";

const DEFAULT_USER_ID = "default-user";

/**
 * GET /api/user/profile
 * Retrieve user profile including level
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[Profile API] GET request - Fetching user profile");

    // Get or create user profile
    const profile = await getOrCreateUserProfile(DEFAULT_USER_ID);

    return Response.json({
      success: true,
      data: {
        userId: profile.userId,
        level: profile.level,
        learningGoal: profile.learningGoal,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Profile API] GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch user profile",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Update user profile (level, learning goal)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Profile API] POST request - Updating profile:", body);

    // Validate level if provided
    if (body.level) {
      const validLevels = ["detailed", "concise"];
      if (!validLevels.includes(body.level)) {
        return Response.json(
          {
            success: false,
            error: "Invalid level. Must be one of: detailed, concise",
          },
          { status: 400 }
        );
      }
    }

    // Get current profile for logging
    const currentProfile = await getOrCreateUserProfile(DEFAULT_USER_ID);
    const oldLevel = currentProfile.level;

    // Update profile
    const updates: {
      level?: "detailed" | "concise";
      learningGoal?: string | null;
    } = {};

    if (body.level) {
      updates.level = body.level;
    }

    if (body.learningGoal !== undefined) {
      updates.learningGoal = body.learningGoal;
    }

    const updatedProfile = await updateUserProfile(DEFAULT_USER_ID, updates);

    // Log level change
    if (body.level && oldLevel !== body.level) {
      console.log(
        `[Profile API] ⚠️  Level changed: ${oldLevel} → ${body.level} for user ${DEFAULT_USER_ID}`
      );
    }

    return Response.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId: updatedProfile.userId,
        level: updatedProfile.level,
        learningGoal: updatedProfile.learningGoal,
        updatedAt: updatedProfile.updatedAt,
      },
      changes: {
        previousLevel: oldLevel,
        newLevel: updatedProfile.level,
      },
    });
  } catch (error) {
    console.error("[Profile API] POST error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to update user profile",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
