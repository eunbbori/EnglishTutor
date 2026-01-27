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
      <div className="min-h-screen bg-ds-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-2 text-ds-text-secondary">
          <div className="w-5 h-5 border-2 border-ds-accent-primary border-t-transparent rounded-full animate-spin" />
          불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-ds-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-ds-text-secondary mb-4">{error || "일기를 찾을 수 없습니다"}</p>
          <Button asChild variant="outline">
            <Link href="/history">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const date = formatDate(entry.createdAt);

  return (
    <div className="min-h-screen bg-ds-bg-primary relative">
      {/* Notebook binding (left side) */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-amber-900/10 to-transparent pointer-events-none z-0">
        <div className="flex flex-col items-center gap-12 pt-20">
          <div className="w-4 h-4 rounded-full bg-zinc-300 shadow-inner" />
          <div className="w-4 h-4 rounded-full bg-zinc-300 shadow-inner" />
          <div className="w-4 h-4 rounded-full bg-zinc-300 shadow-inner" />
          <div className="w-4 h-4 rounded-full bg-zinc-300 shadow-inner" />
          <div className="w-4 h-4 rounded-full bg-zinc-300 shadow-inner" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-ds-border-light bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Date */}
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="flex items-center gap-2 text-ds-text-secondary hover:text-ds-text-primary transition-smooth"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">기록</span>
              </Link>
              {/* Small date badge */}
              <div className="bg-white border-2 border-ds-border-light rounded-lg px-3 py-1.5 shadow-sm">
                <div className="text-center">
                  <p className="text-xs text-ds-text-muted font-medium">
                    {date.month}
                  </p>
                  <p className="text-2xl font-handwriting font-bold text-ds-accent-primary leading-none">
                    {date.day}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Title */}
            <h1 className="font-handwriting text-2xl font-bold text-ds-text-primary absolute left-1/2 -translate-x-1/2">
              Daily English
            </h1>

            {/* Right: Links */}
            <div className="flex items-center gap-3">
              <Link
                href="/vocabulary"
                className="flex items-center gap-1 text-sm text-ds-text-secondary hover:text-ds-text-primary transition-smooth"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">표현노트</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 relative z-10 ml-16">

        {/* Original Text */}
        <section className="mb-8">
          <div className="relative">
            {/* Masking tape */}
            <div className="absolute -top-3 left-8 w-20 h-6 bg-ds-pastel-yellow/70 rounded-sm shadow-sm transform -rotate-2" />

            <div className="card-diary p-6 relative">
              <h2 className="text-sm font-medium text-ds-text-muted mb-4 flex items-center gap-2">
                <span>✏️</span>
                <span>내가 쓴 일기</span>
              </h2>
              <div className="relative pl-4 border-l-2 border-red-200/60">
                <p className="text-lg leading-8 text-ds-text-primary" style={{ fontFamily: "'Georgia', serif" }}>
                  {entry.originalText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Arrow */}
        <div className="flex justify-center my-6">
          <div className="p-2 bg-ds-pastel-coral/50 border border-ds-pastel-coral rounded-full shadow-sm">
            <ArrowRightLeft className="h-5 w-5 text-ds-accent-primary" />
          </div>
        </div>

        {/* Corrected Text */}
        <section className="mb-8">
          <div className="relative">
            {/* Masking tape */}
            <div className="absolute -top-3 right-8 w-20 h-6 bg-ds-pastel-mint/70 rounded-sm shadow-sm transform rotate-2" />

            <div className="card-diary p-6 relative bg-green-50/30 border-green-200/40">
              <h2 className="text-sm font-medium text-ds-text-muted mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>교정된 문장</span>
              </h2>
              <SelectableText sourceType="diary" sourceId={entry.chatId}>
                <p className="text-lg leading-8 text-green-900" style={{ fontFamily: "'Georgia', serif" }}>
                  {entry.correctedText}
                </p>
              </SelectableText>

              {/* Visual Hint */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-ds-pastel-yellow/30 border border-ds-pastel-yellow rounded-lg">
                <Sparkles className="h-4 w-4 text-ds-accent-primary animate-pulse" />
                <span className="text-sm font-medium text-ds-accent-primary">
                  텍스트를 드래그하여 표현 노트에 저장하세요
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Korean Explanation */}
        {entry.koreanExplanation && (
          <section className="mb-8">
            <div className="relative">
              {/* Masking tape */}
              <div className="absolute -top-3 left-12 w-20 h-6 bg-ds-pastel-coral/70 rounded-sm shadow-sm transform -rotate-1" />

              <div className="card-diary p-6 relative bg-ds-pastel-yellow/10 border-ds-pastel-yellow/40">
                <h2 className="text-sm font-medium text-ds-text-muted mb-4 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-ds-accent-primary" />
                  <span>설명</span>
                </h2>
                <p className="text-base leading-7 text-ds-text-primary whitespace-pre-wrap">
                  {entry.koreanExplanation}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Alternatives */}
        {entry.alternatives && entry.alternatives.length > 0 && (
          <section className="mb-8">
            <div className="relative">
              {/* Masking tape */}
              <div className="absolute -top-3 right-12 w-20 h-6 bg-ds-pastel-lavender/70 rounded-sm shadow-sm transform rotate-1" />

              <div className="card-diary p-6 relative bg-blue-50/20 border-blue-200/30">
                <h2 className="text-sm font-medium text-ds-text-muted mb-4 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  <span>다른 표현</span>
                </h2>
                <div className="space-y-4">
                  {entry.alternatives.map((alt, index) => (
                    <div key={index} className="bg-white/50 rounded-lg p-4 border border-ds-border-light">
                      <Badge variant="secondary" className="mb-2 text-xs bg-ds-pastel-lavender/50">
                        {alt.type}
                      </Badge>
                      <SelectableText sourceType="diary" sourceId={entry.chatId}>
                        <p className="text-base text-ds-text-primary" style={{ fontFamily: "'Georgia', serif" }}>
                          {alt.text}
                        </p>
                      </SelectableText>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Insight */}
        {entry.insight && (
          <section className="mb-8">
            <div className="relative">
              {/* Masking tape */}
              <div className="absolute -top-3 left-16 w-20 h-6 bg-ds-pastel-pink/70 rounded-sm shadow-sm transform -rotate-2" />

              <div className="card-diary p-6 relative bg-purple-50/20 border-purple-200/30">
                <h2 className="text-sm font-medium text-ds-text-muted mb-4 flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>오늘의 팁</span>
                </h2>
                <p className="text-base leading-7 text-ds-text-primary">
                  {entry.insight}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-3 pt-6 border-t border-ds-border-light">
          <Button asChild variant="outline" className="rounded-full border-2 border-ds-border-default hover:bg-ds-bg-secondary">
            <Link href="/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-ds-accent-primary hover:bg-ds-accent-hover text-white shadow-card">
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
