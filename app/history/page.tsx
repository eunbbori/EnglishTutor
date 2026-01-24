"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar, PenLine, Book } from "lucide-react";

interface DiaryEntry {
  id: string;
  chatId: string;
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/?login=required");
      return;
    }

    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.getDate(),
      weekday: date.toLocaleDateString("ko-KR", { weekday: "short" }),
      year: date.getFullYear(),
    };
  };

  // Extract first line as preview (topic hint)
  const getPreview = (text: string) => {
    const firstLine = text.split(/[.!?]/)[0];
    return firstLine.length > 40 ? firstLine.substring(0, 40) + "..." : firstLine;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <h1 className="text-lg font-bold">나의 일기장</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/vocabulary"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">단어장</span>
              </Link>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/">
                  <PenLine className="h-4 w-4" />
                  새 일기 쓰기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">아직 작성한 일기가 없어요</h2>
            <p className="text-muted-foreground mb-6">
              오늘부터 영어 일기를 시작해보세요!
            </p>
            <Button asChild className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Link href="/">첫 일기 쓰러 가기</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {entries.map((entry) => {
                const date = formatDate(entry.createdAt);
                return (
                  <Link
                    key={entry.id}
                    href={`/history/${entry.chatId}`}
                    className="group"
                  >
                    <div className="bg-[#fffef9] dark:bg-[#1c1917] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-amber-100/50 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700">
                      {/* Date Header */}
                      <div className="bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-900/40 dark:to-orange-900/40 px-3 py-2 border-b border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-light text-amber-800 dark:text-amber-200">
                              {date.day}
                            </span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {date.month}
                            </span>
                          </div>
                          <span className="text-xs text-amber-700 dark:text-amber-300">
                            {date.weekday}
                          </span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-3 min-h-[80px]">
                        {/* Red margin line decoration */}
                        <div className="relative pl-3 border-l-2 border-red-200/60 dark:border-red-900/40">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                            {getPreview(entry.originalText)}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Calendar className="h-3 w-3" />
                          자세히 보기
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              최근 50개의 일기를 표시합니다
            </p>
          </>
        )}
      </main>
    </div>
  );
}
