"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { LoginButton } from "@/components/auth/login-button";
import { UsageCounter } from "@/components/usage/usage-counter";
import { UpgradeModal } from "@/components/payment/upgrade-modal";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { CorrectionResult } from "@/components/diary/correction-result";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { PenLine, Flame, History } from "lucide-react";
import Link from "next/link";

interface UsageStatus {
  isPremium: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  canUse: boolean;
  isGuest?: boolean;
}

interface CorrectionData {
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  alternatives: Array<{ type: string; text: string }>;
  mistakeType?: string | null;
  insight?: string;
}

// 오늘의 주제 목록
const DAILY_PROMPTS = [
  "오늘 하루 어땠나요?",
  "오늘 먹은 음식 중 가장 맛있었던 것은?",
  "오늘 가장 기억에 남는 순간은?",
  "주말에 뭘 하고 싶나요?",
  "요즘 빠져있는 취미가 있나요?",
  "오늘 새로 배운 것이 있나요?",
  "최근에 본 영화나 드라마는?",
  "오늘 감사한 일 세 가지는?",
  "내일 가장 기대되는 일은?",
  "요즘 고민이 있다면?",
];

// 오늘 날짜 기반으로 주제 선택
function getTodayPrompt(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

type ViewMode = "write" | "result";

export default function Home() {
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayPrompt] = useState(getTodayPrompt());
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);

  // Fetch usage status
  const fetchUsageStatus = useCallback(async () => {
    if (status === "loading") return;

    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsageStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage status:", error);
    }
  }, [status]);

  useEffect(() => {
    fetchUsageStatus();
  }, [fetchUsageStatus]);

  // Fetch streak from API
  const fetchStreak = useCallback(async () => {
    if (status === "loading") return;

    try {
      const response = await fetch("/api/streak");
      if (response.ok) {
        const data = await response.json();
        setStreak(data.currentStreak);
      }
    } catch (error) {
      console.error("Failed to fetch streak:", error);
    }
  }, [status]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const handleSubmit = async (userMessage: string) => {
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          chatId,
          mode: "diary",
        }),
      });

      // Handle usage limit exceeded (429)
      if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.code === "USAGE_LIMIT_EXCEEDED") {
          setShowUpgradeModal(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Get chat ID from headers
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !chatId) {
        setChatId(newChatId);
      }

      // Parse JSON response
      const data = await response.json();
      const result = data.object;

      setCorrectionData(result);
      setViewMode("result");

      // Refresh usage status and streak
      await Promise.all([fetchUsageStatus(), fetchStreak()]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error in result
      setCorrectionData({
        originalText: userMessage,
        correctedText: "Error",
        koreanExplanation: "오류가 발생했습니다. 다시 시도해주세요.",
        alternatives: [],
      });
      setViewMode("result");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewEntry = () => {
    setCorrectionData(null);
    setChatId(null);
    setViewMode("write");
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Daily English</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Streak Badge */}
              {streak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak}일
                </Badge>
              )}
              {/* History Link */}
              {session?.user && (
                <Link
                  href="/history"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">기록</span>
                </Link>
              )}
              {session?.user && usageStatus && (
                <UsageCounter
                  remaining={usageStatus.remaining}
                  isPremium={usageStatus.isPremium}
                />
              )}
              <LoginButton user={session?.user} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        {viewMode === "write" ? (
          <DiaryEditor
            todayPrompt={todayPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ) : correctionData ? (
          <CorrectionResult
            data={correctionData}
            onNewEntry={handleNewEntry}
          />
        ) : null}
      </div>

      <Toaster />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </main>
  );
}
