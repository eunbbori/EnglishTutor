"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, X, Check } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  const features = [
    "무제한 일기 교정",
    "상세한 문법 설명",
    "다양한 표현 제안",
    "학습 진도 추적",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="text-center">
          <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-full w-fit">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>오늘의 무료 사용량을 모두 사용했어요</CardTitle>
          <CardDescription>
            Premium으로 업그레이드하고 제한 없이 사용하세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="font-medium mb-3 text-sm">Premium 혜택</p>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold">
              ₩6,900<span className="text-sm font-normal text-muted-foreground">/월</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              나중에
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/pricing">업그레이드</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            내일 자정에 무료 사용량이 리셋됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
