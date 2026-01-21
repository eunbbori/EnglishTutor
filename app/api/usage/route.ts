import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsageStatus } from "@/lib/subscription/check-usage";

export async function GET() {
  try {
    const session = await auth();

    // 비로그인 사용자는 게스트로 처리 (로컬 스토리지 기반으로 프론트에서 처리)
    if (!session?.user?.id) {
      return NextResponse.json({
        isPremium: false,
        dailyLimit: 3,
        usedToday: 0,
        remaining: 3,
        canUse: true,
        isGuest: true,
      });
    }

    const status = await getUsageStatus(session.user.id);

    return NextResponse.json({
      ...status,
      isGuest: false,
    });
  } catch (error) {
    console.error("[Usage API Error]", error);
    return NextResponse.json(
      { error: "Failed to get usage status" },
      { status: 500 }
    );
  }
}
