import { db } from "@/db";
import { dailyUsage, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const FREE_DAILY_LIMIT = 3;

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export interface UsageStatus {
  isPremium: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  canUse: boolean;
}

/**
 * 사용자의 구독 상태 확인
 */
export async function checkSubscription(userId: string): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.plan, "premium"),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (!subscription) return false;

  // 만료일 체크
  if (subscription.endDate && subscription.endDate < new Date()) {
    // 구독 만료 처리
    await db
      .update(subscriptions)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(subscriptions.id, subscription.id));
    return false;
  }

  return true;
}

/**
 * 오늘 사용량 조회
 */
export async function getDailyUsage(userId: string): Promise<number> {
  const today = getTodayDate();

  const [usage] = await db
    .select()
    .from(dailyUsage)
    .where(
      and(
        eq(dailyUsage.userId, userId),
        eq(dailyUsage.date, today)
      )
    )
    .limit(1);

  return usage?.count || 0;
}

/**
 * 사용량 증가
 */
export async function incrementUsage(userId: string): Promise<number> {
  const today = getTodayDate();

  const [existing] = await db
    .select()
    .from(dailyUsage)
    .where(
      and(
        eq(dailyUsage.userId, userId),
        eq(dailyUsage.date, today)
      )
    )
    .limit(1);

  if (existing) {
    // 기존 레코드 업데이트
    const newCount = existing.count + 1;
    await db
      .update(dailyUsage)
      .set({ count: newCount, updatedAt: new Date() })
      .where(eq(dailyUsage.id, existing.id));
    return newCount;
  } else {
    // 새 레코드 생성
    await db.insert(dailyUsage).values({
      userId,
      date: today,
      count: 1,
    });
    return 1;
  }
}

/**
 * 사용 가능 여부 및 상태 조회
 */
export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const isPremium = await checkSubscription(userId);
  const usedToday = await getDailyUsage(userId);

  if (isPremium) {
    return {
      isPremium: true,
      dailyLimit: Infinity,
      usedToday,
      remaining: Infinity,
      canUse: true,
    };
  }

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);

  return {
    isPremium: false,
    dailyLimit: FREE_DAILY_LIMIT,
    usedToday,
    remaining,
    canUse: remaining > 0,
  };
}

/**
 * 사용 가능 여부만 빠르게 체크
 */
export async function canUseService(userId: string): Promise<boolean> {
  const status = await getUsageStatus(userId);
  return status.canUse;
}
