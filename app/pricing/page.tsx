"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
const SUBSCRIPTION_AMOUNT = 9900;

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
  }
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 토스페이먼츠 SDK 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (status !== "authenticated" || !session?.user) {
      // 로그인 필요
      router.push("/?login=required");
      return;
    }

    if (!window.TossPayments) {
      alert("결제 모듈을 로드하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
      const orderId = `DAILYENG_${Date.now()}_${session.user.id?.slice(0, 8)}`;

      await tossPayments.requestPayment("카드", {
        amount: SUBSCRIPTION_AMOUNT,
        orderId,
        orderName: "Daily English Premium 월 구독",
        customerName: session.user.name || "고객",
        customerEmail: session.user.email || undefined,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("결제 요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const freeFeatures = [
    "하루 3회 무료 교정",
    "자연스러운 표현 제안",
    "한국어 문법 설명",
  ];

  const premiumFeatures = [
    "무제한 일기 교정",
    "자연스러운 표현 제안",
    "한국어 문법 설명",
    "학습 진도 추적",
    "연속 작성 배지",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Daily English 요금제</h1>
          </div>
          <p className="text-muted-foreground">
            매일 영어 일기를 쓰며 실력을 키워보세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>체험해보세요</CardDescription>
              <div className="text-3xl font-bold">
                ₩0
                <span className="text-sm font-normal text-muted-foreground">/월</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">무료로 시작하기</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-primary relative">
            <Badge className="absolute -top-2 right-4">추천</Badge>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>제한 없이 사용하세요</CardDescription>
              <div className="text-3xl font-bold">
                ₩9,900
                <span className="text-sm font-normal text-muted-foreground">/월</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handlePayment}
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "Premium 구독하기"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          <br />
          구독은 언제든지 취소할 수 있습니다.
        </p>
      </main>
    </div>
  );
}
