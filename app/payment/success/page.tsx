"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setErrorMessage("결제 정보가 올바르지 않습니다.");
        return;
      }

      try {
        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "결제 확인 실패");
        }

        setStatus("success");
      } catch (error) {
        console.error("Payment confirmation error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "결제 확인 중 오류가 발생했습니다.");
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {status === "processing" && (
          <>
            <CardHeader className="text-center">
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
              <CardTitle className="mt-4">결제 확인 중</CardTitle>
              <CardDescription>잠시만 기다려주세요...</CardDescription>
            </CardHeader>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <CardTitle className="mt-4">결제 완료!</CardTitle>
              <CardDescription>
                Politely Premium 구독이 시작되었습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">구독 혜택</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>- 무제한 비즈니스 영어 교정</li>
                  <li>- 우선 응답 처리</li>
                  <li>- 고급 비즈니스 템플릿</li>
                </ul>
              </div>
              <Button className="w-full" asChild>
                <Link href="/">Politely 사용하기</Link>
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="h-16 w-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <CardTitle className="mt-4">결제 확인 실패</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                문제가 지속되면 고객센터로 문의해주세요.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/">홈으로</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/pricing">다시 시도</Link>
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
              <CardTitle className="mt-4">로딩 중</CardTitle>
              <CardDescription>잠시만 기다려주세요...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
