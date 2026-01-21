"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-500" />
          <CardTitle className="mt-4">결제 실패</CardTitle>
          <CardDescription>
            {errorMessage || "결제 처리 중 문제가 발생했습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorCode && (
            <p className="text-xs text-muted-foreground text-center">
              오류 코드: {errorCode}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">홈으로</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/pricing">다시 시도</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
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
      <PaymentFailContent />
    </Suspense>
  );
}
