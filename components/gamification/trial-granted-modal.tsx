/**
 * Lv.10 Trial Granted Modal
 * v3.1.1: Displays when user reaches Lv.10 and receives 3-day premium trial
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Gift, Sparkles } from "lucide-react";

interface TrialGrantedModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel?: number;
  newTitle?: string;
}

export function TrialGrantedModal({
  isOpen,
  onClose,
  newLevel = 10,
  newTitle = "Daily Writer"
}: TrialGrantedModalProps) {
  if (!isOpen) return null;

  const trialDuration = "3일";
  const trialFeatures = [
    "Lv.30까지 무제한 레벨업",
    "고급 AI 교정 및 설명",
    "무제한 일기 작성",
    "AI Pen Pal 답장",
    "보물상자 & 주간 퀘스트",
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
          {/* Celebration Icon */}
          <div className="mx-auto mb-3 p-4 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-yellow-900/30 rounded-full w-fit relative">
            <Gift className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <CardTitle className="text-2xl">🎉 축하합니다!</CardTitle>
          <CardDescription className="text-base">
            Lv.{newLevel} ({newTitle}) 달성 기념 선물
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trial Grant Notice */}
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {trialDuration} 프리미엄 체험권
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              자동으로 프리미엄 기능이 활성화되었습니다!
            </p>
          </div>

          {/* Trial Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {trialDuration} 동안 사용 가능한 기능:
            </p>
            <ul className="space-y-2">
              {trialFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 <strong>체험 기간 동안 획득한 XP와 레벨은 유지</strong>됩니다.
              체험 종료 후에도 Lv.10까지의 진행 상황은 보존돼요!
            </p>
          </div>

          {/* Action Button */}
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={onClose}
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            체험 시작하기
          </Button>

          {/* Additional Info */}
          <p className="text-xs text-center text-muted-foreground">
            체험 종료 3일 전에 알림을 드립니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
