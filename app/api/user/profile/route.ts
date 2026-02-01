import { NextRequest } from "next/server";
import { getOrCreateUserProfile, getExplanationStyle, updateUserProfile } from "@/lib/db/user-profile";

const DEFAULT_USER_ID = "default-user";

/**
 * GET /api/user/profile
 * Retrieve user profile including explanation style
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[Profile API] GET request - Fetching user profile");

    // Get or create user profile
    const profile = await getOrCreateUserProfile(DEFAULT_USER_ID);
    const explanationStyle = getExplanationStyle(profile);

    return Response.json({
      success: true,
      data: {
        userId: profile.userId,
        explanationStyle, // v3.0: extracted from learning_preferences
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
 * Update user profile (explanation style, learning goal)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Profile API] POST request - Updating profile:", body);

    // Validate explanation style if provided
    if (body.explanationStyle) {
      const validStyles = ["detailed", "concise"];
      if (!validStyles.includes(body.explanationStyle)) {
        return Response.json(
          {
            success: false,
            error: "Invalid explanationStyle. Must be one of: detailed, concise",
          },
          { status: 400 }
        );
      }
    }

    // Get current profile for logging
    const currentProfile = await getOrCreateUserProfile(DEFAULT_USER_ID);
    const oldStyle = getExplanationStyle(currentProfile);

    // Update profile
    const updates: {
      learningGoal?: string | null;
      learningPreferences?: Record<string, unknown>;
    } = {};

    if (body.explanationStyle) {
      // v3.0: Store in learning_preferences
      updates.learningPreferences = {
        ...(typeof currentProfile.learningPreferences === 'object' && currentProfile.learningPreferences !== null
          ? currentProfile.learningPreferences as Record<string, unknown>
          : {}),
        explanation_style: body.explanationStyle,
      };
    }

    if (body.learningGoal !== undefined) {
      updates.learningGoal = body.learningGoal;
    }

    const updatedProfile = await updateUserProfile(DEFAULT_USER_ID, updates);
    const newStyle = getExplanationStyle(updatedProfile);

    // Log style change
    if (body.explanationStyle && oldStyle !== body.explanationStyle) {
      console.log(
        `[Profile API] ⚠️  Explanation style changed: ${oldStyle} → ${body.explanationStyle} for user ${DEFAULT_USER_ID}`
      );
    }

    return Response.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId: updatedProfile.userId,
        explanationStyle: newStyle,
        learningGoal: updatedProfile.learningGoal,
        updatedAt: updatedProfile.updatedAt,
      },
      changes: {
        previousStyle: oldStyle,
        newStyle: newStyle,
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
