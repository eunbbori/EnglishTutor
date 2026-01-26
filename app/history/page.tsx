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
      <div className="min-h-screen bg-ds-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-2 text-ds-text-secondary">
          <div className="w-5 h-5 border-2 border-ds-accent-primary border-t-transparent rounded-full animate-spin" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg-primary">
      {/* Header */}
      <header className="border-b border-ds-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-ds-text-secondary hover:text-ds-text-primary transition-smooth"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-ds-accent-primary" />
                <h1 className="font-handwriting text-2xl font-bold text-ds-text-primary">나의 일기장</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/vocabulary"
                className="flex items-center gap-1 text-sm text-ds-text-secondary hover:text-ds-text-primary transition-smooth"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">표현노트</span>
              </Link>
              <Button asChild size="sm" className="gap-2 bg-ds-accent-primary hover:bg-ds-accent-hover text-white rounded-full shadow-card">
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
            <div className="w-20 h-20 mx-auto mb-6 bg-ds-pastel-yellow rounded-full flex items-center justify-center shadow-card">
              <BookOpen className="h-10 w-10 text-ds-accent-primary" />
            </div>
            <h2 className="font-handwriting text-3xl font-bold mb-2 text-ds-text-primary">아직 작성한 일기가 없어요</h2>
            <p className="text-ds-text-secondary mb-6">
              오늘부터 영어 일기를 시작해보세요!
            </p>
            <Button asChild className="rounded-full bg-ds-accent-primary hover:bg-ds-accent-hover text-white shadow-card">
              <Link href="/">첫 일기 쓰러 가기</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {entries.map((entry, index) => {
                const date = formatDate(entry.createdAt);
                // 마스킹 테이프 색상 순환
                const tapeColors = [
                  'bg-ds-pastel-mint',
                  'bg-ds-pastel-coral',
                  'bg-ds-pastel-yellow',
                  'bg-ds-pastel-lavender',
                  'bg-ds-pastel-pink'
                ];
                const tapeColor = tapeColors[index % tapeColors.length];

                return (
                  <Link
                    key={entry.id}
                    href={`/history/${entry.chatId}`}
                    className="group"
                  >
                    <div className="card-diary hover:shadow-elevated transition-smooth group-hover:scale-[1.02] overflow-hidden">
                      {/* Date Badge with Masking Tape Effect */}
                      <div className={`masking-tape ${tapeColor} px-3 py-2`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-ds-text-primary">
                              {date.day}
                            </span>
                            <span className="text-xs font-medium text-ds-text-secondary uppercase">
                              {date.month}
                            </span>
                          </div>
                          <span className="text-xs text-ds-text-secondary">
                            {date.weekday}
                          </span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-4 min-h-[100px] bg-white">
                        <p className="text-sm text-ds-text-secondary line-clamp-4 leading-relaxed font-sans">
                          {getPreview(entry.originalText)}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="px-4 pb-3 bg-white">
                        <div className="flex items-center gap-1 text-xs text-ds-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <Calendar className="h-3 w-3" />
                          자세히 보기
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="text-center text-sm text-ds-text-muted mt-8">
              최근 50개의 일기를 표시합니다
            </p>
          </>
        )}
      </main>
    </div>
  );
}
