import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { confirmPayment, SUBSCRIPTION_AMOUNT } from "@/lib/payment/toss";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentKey, orderId, amount } = await req.json();

    // 금액 검증
    if (amount !== SUBSCRIPTION_AMOUNT) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인
    const payment = await confirmPayment({
      paymentKey,
      orderId,
      amount,
    });

    // 구독 정보 저장/업데이트
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1개월 후

    // 기존 구독 확인
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (existingSubscription.length > 0) {
      // 기존 구독 업데이트
      await db
        .update(subscriptions)
        .set({
          plan: "premium",
          status: "active",
          paymentKey,
          startDate: new Date(),
          endDate,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, session.user.id));
    } else {
      // 새 구독 생성
      await db.insert(subscriptions).values({
        userId: session.user.id,
        plan: "premium",
        status: "active",
        paymentKey,
        startDate: new Date(),
        endDate,
      });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("[Payment Confirm Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment confirmation failed" },
      { status: 500 }
    );
  }
}
