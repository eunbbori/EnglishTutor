import { auth } from "@/lib/auth";
import { getOrCreateStreak } from "@/lib/streak/streak-manager";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Return default streak for non-authenticated users
      return Response.json({
        currentStreak: 0,
        longestStreak: 0,
        lastWrittenAt: null,
        totalEntries: 0,
        wroteToday: false,
        isGuest: true,
      });
    }

    const streakInfo = await getOrCreateStreak(session.user.id);

    return Response.json({
      ...streakInfo,
      isGuest: false,
    });
  } catch (error) {
    console.error("[Streak API Error]", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch streak info" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
