"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Check, Lock } from "lucide-react";
import Link from "next/link";

interface LevelCapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelCapModal({ isOpen, onClose }: LevelCapModalProps) {
  if (!isOpen) return null;

  const premiumBenefits = [
    "Lv.30까지 레벨업 가능",
    "고급 영어 설명 및 표현",
    "전문가 수준의 AI 교정",
    "무제한 일기 작성",
    "AI Pen Pal 답장",
    "보물상자 & 퀘스트",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full w-fit">
            <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">레벨 10 달성!</CardTitle>
          <CardDescription>
            축하합니다! 무료 레벨 상한에 도달했어요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="text-center p-3 bg-muted rounded-lg">
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-2">
              Lv.10 (Daily Writer)
            </Badge>
            <p className="text-sm text-muted-foreground">
              현재 레벨에서 더 이상 레벨업할 수 없어요
            </p>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
            <p className="font-medium mb-3 text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Premium으로 더 높은 레벨에 도전하세요
            </p>
            <ul className="space-y-2">
              {premiumBenefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* XP Notice */}
          <div className="text-xs text-muted-foreground text-center bg-muted p-2 rounded">
            💡 XP는 계속 쌓여요! 프리미엄 전환 시 즉시 레벨이 반영됩니다
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              나중에
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/pricing">프리미엄 시작하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
