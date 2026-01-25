"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckCircle2, Lightbulb, RefreshCw, ArrowRight, ArrowRightLeft, Book, Sparkles } from "lucide-react";
import { SelectableText } from "@/components/vocabulary/selectable-text";

interface DiaryEntryDetail {
  id: string;
  chatId: string;
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  alternatives: Array<{ type: string; text: string }>;
  mistakeType?: string | null;
  insight?: string;
  createdAt: string;
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [entry, setEntry] = useState<DiaryEntryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/?login=required");
      return;
    }

    if (status === "authenticated") {
      fetchEntry();
    }
  }, [status, router, resolvedParams.id]);

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/history/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setEntry(data.entry);
      } else if (response.status === 404) {
        setError("일기를 찾을 수 없습니다");
      } else {
        setError("불러오기에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to fetch entry:", error);
      setError("불러오기에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.getDate(),
      year: date.getFullYear(),
    };
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

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "일기를 찾을 수 없습니다"}</p>
          <Button asChild variant="outline">
            <Link href="/history">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const date = formatDate(entry.createdAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/history"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">목록으로</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/vocabulary"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">단어장</span>
              </Link>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                교정 완료
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Date Stamp */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-200/60 dark:border-amber-800/60 rounded-2xl px-6 py-3 shadow-sm">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-medium">
                {date.month} {date.year}
              </p>
              <p className="text-4xl font-light text-amber-800 dark:text-amber-200 my-1">
                {date.day}
              </p>
            </div>
          </div>
        </div>

        {/* Original Text */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <h2 className="text-sm font-medium text-muted-foreground">내가 쓴 일기</h2>
          </div>
          <div className="bg-[#fffef9] dark:bg-[#1c1917] rounded-xl p-5 border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
            <div className="relative pl-4 border-l-2 border-red-200/60 dark:border-red-900/40">
              <p className="text-lg leading-8 text-zinc-800 dark:text-zinc-200" style={{ fontFamily: "'Georgia', serif" }}>
                {entry.originalText}
              </p>
            </div>
          </div>
        </section>

        {/* Arrow */}
        <div className="flex justify-center my-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
            <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Corrected Text */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <h2 className="text-sm font-medium text-muted-foreground">교정된 문장</h2>
          </div>
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-5 border border-green-200/50 dark:border-green-900/30 shadow-sm">
            <SelectableText sourceType="diary" sourceId={entry.chatId}>
              <p className="text-lg leading-8 text-green-900 dark:text-green-100" style={{ fontFamily: "'Georgia', serif" }}>
                {entry.correctedText}
              </p>
            </SelectableText>

            {/* Visual Hint */}
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                💡 텍스트를 드래그하여 표현 노트에 저장하세요
              </span>
            </div>
          </div>
        </section>

        {/* Korean Explanation */}
        {entry.koreanExplanation && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-medium text-muted-foreground">설명</h2>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-5 border border-amber-200/50 dark:border-amber-900/30">
              <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {entry.koreanExplanation}
              </p>
            </div>
          </section>
        )}

        {/* Alternatives */}
        {entry.alternatives && entry.alternatives.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-medium text-muted-foreground">다른 표현</h2>
            </div>
            <div className="space-y-3">
              {entry.alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-900/30"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {alt.type}
                  </Badge>
                  <SelectableText sourceType="diary" sourceId={entry.chatId}>
                    <p className="text-base text-zinc-700 dark:text-zinc-300" style={{ fontFamily: "'Georgia', serif" }}>
                      {alt.text}
                    </p>
                  </SelectableText>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Insight */}
        {entry.insight && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💡</span>
              <h2 className="text-sm font-medium text-muted-foreground">오늘의 팁</h2>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-5 border border-purple-200/50 dark:border-purple-900/30">
              <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
                {entry.insight}
              </p>
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Link href="/">
              새 일기 쓰기
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
