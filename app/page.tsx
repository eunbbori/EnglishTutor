"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { LoginButton } from "@/components/auth/login-button";
import { UsageCounter } from "@/components/usage/usage-counter";
import { UpgradeModal } from "@/components/payment/upgrade-modal";
import { DiaryEditor, DiaryPrompt } from "@/components/diary/diary-editor";
import { CorrectionResult } from "@/components/diary/correction-result";
import { CalendarView } from "@/components/calendar/calendar-view";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { PenLine, Flame, History, Calendar, BookOpen, Shield } from "lucide-react";
import Link from "next/link";
import { LevelBadge } from "@/components/gamification/level-badge";
import { useXpToast } from "@/components/gamification/xp-toast";

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
  keywords?: string[];
  mood?: string;
  xpResults?: Array<{
    action: string;
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
  }>;
}

// 오늘의 주제 목록 (id, title, placeholder)
const DIARY_PROMPTS: DiaryPrompt[] = [
  {
    id: "how-was-day",
    title: "오늘 하루 어땠나요?",
    placeholder: "How was your day? Write about what happened today...",
  },
  {
    id: "food",
    title: "오늘 먹은 음식 중 가장 맛있었던 것은?",
    placeholder: "What delicious food did you eat today? Describe the taste and how you felt...",
  },
  {
    id: "memorable-moment",
    title: "오늘 가장 기억에 남는 순간은?",
    placeholder: "What was the most memorable moment of your day? Why was it special?",
  },
  {
    id: "weekend-plans",
    title: "주말에 뭘 하고 싶나요?",
    placeholder: "What do you want to do this weekend? Share your plans or wishes...",
  },
  {
    id: "hobby",
    title: "요즘 빠져있는 취미가 있나요?",
    placeholder: "What hobby are you into these days? Why do you enjoy it?",
  },
  {
    id: "learned-today",
    title: "오늘 새로 배운 것이 있나요?",
    placeholder: "Did you learn something new today? What was it about?",
  },
  {
    id: "movie-drama",
    title: "최근에 본 영화나 드라마는?",
    placeholder: "What movie or drama did you watch recently? How was it?",
  },
  {
    id: "grateful",
    title: "오늘 감사한 일 세 가지는?",
    placeholder: "What are three things you're grateful for today? Think about the small moments...",
  },
  {
    id: "tomorrow",
    title: "내일 가장 기대되는 일은?",
    placeholder: "What are you looking forward to tomorrow? Why does it excite you?",
  },
  {
    id: "worry",
    title: "요즘 고민이 있다면?",
    placeholder: "Is there something on your mind lately? Feel free to share your thoughts...",
  },
];

// 오늘 날짜 기반으로 기본 주제 ID 선택
function getTodayPromptId(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DIARY_PROMPTS[dayOfYear % DIARY_PROMPTS.length].id;
}

type ViewMode = "calendar" | "write" | "result";

export default function Home() {
  const { data: session, status } = useSession();
  const { showXpGained } = useXpToast();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [defaultPromptId] = useState(getTodayPromptId());
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
  const [levelBadgeKey, setLevelBadgeKey] = useState(0); // Force LevelBadge refresh

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
        setFreezeCount(data.freezeCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch streak:", error);
    }
  }, [status]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const handleSubmit = async (userMessage: string, promptId: string | null, mood: string | null) => {
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
          promptId, // 선택된 주제 ID 전달
          mood, // 선택된 감정 전달
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

      // Show XP toasts if XP was granted
      if (result.xpResults && result.xpResults.length > 0) {
        // Calculate total XP gained
        const totalXp = result.xpResults.reduce((sum: number, xp: any) => sum + xp.xpGained, 0);

        // Show toast for each XP action
        result.xpResults.forEach((xp: any, index: number) => {
          setTimeout(() => {
            showXpGained(xp.xpGained, xp.action, false);
          }, index * 500); // Stagger toasts by 500ms
        });

        // Refresh LevelBadge to show new level/XP
        setLevelBadgeKey(prev => prev + 1);
      }

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
    // Check usage limit before allowing user to write new entry
    if (usageStatus && !usageStatus.isPremium && usageStatus.remaining === 0) {
      setShowUpgradeModal(true);
      return;
    }

    setCorrectionData(null);
    setChatId(null);
    setViewMode("write"); // Go directly to write mode for new entry
  };

  const handleWriteToday = () => {
    // Check usage limit before allowing user to write
    if (usageStatus && !usageStatus.isPremium && usageStatus.remaining === 0) {
      setShowUpgradeModal(true);
      return;
    }

    setViewMode("write");
  };

  const handleToggleView = () => {
    if (viewMode === "calendar") {
      // Switching to write mode - check usage limit
      handleWriteToday();
    } else {
      // Switching back to calendar - no check needed
      setViewMode("calendar");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-ds-bg-primary">
      {/* Header - Responsive with HIG touch targets */}
      <header className="border-b border-ds-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo/Title - Responsive */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-ds-accent-primary flex-shrink-0" />
              <h1 className="font-handwriting text-lg sm:text-xl lg:text-2xl font-bold text-ds-text-primary truncate">
                Daily English
              </h1>
            </div>

            {/* Navigation - Responsive with HIG 44pt touch targets */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* Level Badge - Show for authenticated users */}
              {status === "authenticated" && <LevelBadge key={levelBadgeKey} />}

              {/* Streak Badge - Hide on very small screens */}
              {streak > 0 && (
                <Badge variant="secondary" className="hidden xs:flex gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-xs px-2 py-0.5">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="hidden sm:inline">{streak}일</span>
                  <span className="sm:hidden">{streak}</span>
                </Badge>
              )}

              {/* Freeze Badge - Show if user has Freeze */}
              {status === "authenticated" && freezeCount > 0 && (
                <Badge variant="outline" className="hidden xs:flex gap-1 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 text-xs px-2 py-0.5">
                  <Shield className="h-3 w-3" />
                  <span>{freezeCount}</span>
                </Badge>
              )}

              {/* Calendar/Write Toggle - HIG touch target */}
              {viewMode !== "result" && (
                <button
                  onClick={handleToggleView}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                  aria-label={viewMode === "calendar" ? "일기 쓰기" : "달력 보기"}
                >
                  {viewMode === "calendar" ? (
                    <>
                      <PenLine className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span className="hidden md:inline">쓰기</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span className="hidden md:inline">달력</span>
                    </>
                  )}
                </button>
              )}

              {/* History Link - HIG touch target */}
              {session?.user && (
                <Link
                  href="/history"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                  aria-label="일기 기록"
                >
                  <History className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">기록</span>
                </Link>
              )}

              {/* Vocabulary Link - HIG touch target */}
              {session?.user && (
                <Link
                  href="/vocabulary"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                  aria-label="표현노트"
                >
                  <BookOpen className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">표현노트</span>
                </Link>
              )}

              {/* Usage Counter - Hide on mobile */}
              {session?.user && usageStatus && (
                <div className="hidden sm:block">
                  <UsageCounter
                    remaining={usageStatus.remaining}
                    isPremium={usageStatus.isPremium}
                  />
                </div>
              )}

              <LoginButton user={session?.user} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive padding with safe area */}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 lg:py-12 safe-bottom">
        {viewMode === "calendar" ? (
          <CalendarView onWriteToday={handleWriteToday} />
        ) : viewMode === "write" ? (
          <DiaryEditor
            prompts={DIARY_PROMPTS}
            defaultPromptId={defaultPromptId}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ) : correctionData ? (
          <CorrectionResult
            data={correctionData}
            onNewEntry={handleNewEntry}
            chatId={chatId || undefined}
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
