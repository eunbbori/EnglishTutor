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
import { PenLine, Flame, History, Calendar } from "lucide-react";
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
  keywords?: string[];
  mood?: string;
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
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [defaultPromptId] = useState(getTodayPromptId());
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
    setViewMode("calendar");
  };

  const handleWriteToday = () => {
    setViewMode("write");
  };

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-amber-600" />
              <h1 className="text-lg font-bold">Daily English</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Streak Badge */}
              {streak > 0 && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak}일
                </Badge>
              )}
              {/* Calendar/Write Toggle */}
              {viewMode !== "result" && (
                <button
                  onClick={() => setViewMode(viewMode === "calendar" ? "write" : "calendar")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {viewMode === "calendar" ? (
                    <>
                      <PenLine className="h-4 w-4" />
                      <span className="hidden sm:inline">쓰기</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">달력</span>
                    </>
                  )}
                </button>
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
