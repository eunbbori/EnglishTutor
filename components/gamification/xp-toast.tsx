"use client";

import { useToast } from "@/hooks/use-toast";
import { Sparkles, Zap } from "lucide-react";

/**
 * XP Toast Hook
 * Provides functions to show XP-related toast notifications
 */
export function useXpToast() {
  const { toast } = useToast();

  /**
   * Show XP gained toast
   * @param xpGained - Amount of XP gained
   * @param action - Action that granted XP (optional)
   * @param boosterApplied - Whether XP booster was applied
   */
  const showXpGained = (
    xpGained: number,
    action?: string,
    boosterApplied?: boolean
  ) => {
    const actionLabels: Record<string, string> = {
      diary_submit: "일기 제출",
      challenge_word: "챌린지 단어 사용",
      perfect_diary: "완벽한 일기",
      expression_save: "표현 저장",
      streak_7d: "7일 연속 달성",
      streak_30d: "30일 연속 달성",
      weekly_quest: "주간 퀘스트 완료",
      monthly_challenge: "월간 챌린지 완료",
      weekly_bonus: "주간 보너스",
      welcome_back: "복귀 환영",
      comeback_kid: "컴백 달성",
      treasure_chest: "보물상자",
    };

    const actionLabel = action && actionLabels[action] ? actionLabels[action] : null;

    const titleText = boosterApplied
      ? `+${xpGained} XP 획득! (2x 부스터)`
      : `+${xpGained} XP 획득!`;

    toast({
      title: titleText,
      description: actionLabel ? `${actionLabel}` : undefined,
      duration: 3000,
    });
  };

  /**
   * Show booster activated toast
   * @param durationHours - Booster duration in hours
   */
  const showBoosterActivated = (durationHours: number) => {
    toast({
      title: "XP 2배 부스터 활성화!",
      description: `앞으로 ${durationHours}시간 동안 모든 XP를 2배로 획득합니다`,
      duration: 5000,
    });
  };

  /**
   * Show level cap reached toast (for free users at Lv.10)
   */
  const showLevelCapReached = () => {
    toast({
      title: "레벨 상한에 도달했어요",
      description: "프리미엄으로 업그레이드하고 더 높은 레벨에 도전하세요!",
      duration: 5000,
    });
  };

  return {
    showXpGained,
    showBoosterActivated,
    showLevelCapReached,
  };
}
