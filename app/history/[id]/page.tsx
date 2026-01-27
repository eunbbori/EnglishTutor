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
    <div className="min-h-screen vintage-bg relative">
      {/* Notebook binding (left side) - vintage style */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-transparent pointer-events-none z-0 shadow-inner">
        <div className="flex flex-col items-center gap-16 pt-24">
          <div className="w-4 h-4 rounded-full bg-amber-900/30 shadow-inner border border-amber-800/20" />
          <div className="w-4 h-4 rounded-full bg-amber-900/30 shadow-inner border border-amber-800/20" />
          <div className="w-4 h-4 rounded-full bg-amber-900/30 shadow-inner border border-amber-800/20" />
          <div className="w-4 h-4 rounded-full bg-amber-900/30 shadow-inner border border-amber-800/20" />
          <div className="w-4 h-4 rounded-full bg-amber-900/30 shadow-inner border border-amber-800/20" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b-2 border-amber-900/20 bg-gradient-to-b from-amber-50/80 to-transparent backdrop-blur sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Date */}
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="flex items-center gap-2 text-amber-800 hover:text-amber-900 transition-smooth"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">기록</span>
              </Link>
              {/* Small date badge - vintage style */}
              <div className="bg-amber-100/50 border-2 border-amber-800/30 rounded-lg px-3 py-1.5 shadow-md transform rotate-1">
                <div className="text-center">
                  <p className="text-xs text-amber-800/70 font-medium uppercase">
                    {date.month}
                  </p>
                  <p className="text-2xl font-handwriting font-bold text-amber-900 leading-none">
                    {date.day}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Title */}
            <h1 className="font-handwriting text-3xl font-bold text-amber-900 absolute left-1/2 -translate-x-1/2">
              Daily English
            </h1>

            {/* Right: Links */}
            <div className="flex items-center gap-3">
              <Link
                href="/vocabulary"
                className="flex items-center gap-1 text-sm text-amber-800 hover:text-amber-900 transition-smooth font-medium"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">표현노트</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">

        {/* Original Text */}
        <section className="mb-12 transform hover:scale-[1.01] transition-transform">
          <div className="relative">
            {/* Masking tape - vintage style */}
            <div className="absolute -top-4 left-12 w-32 h-8 bg-amber-200/60 rounded-sm shadow-md transform -rotate-3 border border-amber-300/40">
              <div className="w-full h-full opacity-20 bg-gradient-to-r from-transparent via-amber-900/10 to-transparent" />
            </div>

            <div className="torn-paper p-6 relative">
              <h2 className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span>✏️</span>
                <span>오늘의 일기</span>
              </h2>
              <div className="relative pl-4 border-l-2 border-amber-300/60">
                <p className="text-lg leading-8 text-amber-900" style={{ fontFamily: "'Georgia', serif" }}>
                  {entry.originalText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Arrow */}
        <div className="flex justify-center my-8">
          <div className="p-3 bg-amber-200/40 border-2 border-amber-800/20 rounded-full shadow-md">
            <ArrowRightLeft className="h-6 w-6 text-amber-900" />
          </div>
        </div>

        {/* Corrected Text */}
        <section className="mb-12 transform hover:scale-[1.01] transition-transform">
          <div className="relative">
            {/* Masking tape - vintage style */}
            <div className="absolute -top-4 right-12 w-32 h-8 bg-green-200/50 rounded-sm shadow-md transform rotate-2 border border-green-300/40">
              <div className="w-full h-full opacity-20 bg-gradient-to-r from-transparent via-green-900/10 to-transparent" />
            </div>

            <div className="torn-paper p-6 relative bg-green-50/20">
              <h2 className="text-sm font-semibold text-green-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>교정</span>
              </h2>
              <SelectableText sourceType="diary" sourceId={entry.chatId}>
                <p className="text-lg leading-8 text-green-900" style={{ fontFamily: "'Georgia', serif" }}>
                  {entry.correctedText}
                </p>
              </SelectableText>

              {/* Visual Hint */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-100/40 border border-amber-800/20 rounded">
                <Sparkles className="h-4 w-4 text-amber-800 animate-pulse" />
                <span className="text-xs font-medium text-amber-900">
                  텍스트를 드래그하여 표현 노트에 저장하세요
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Korean Explanation */}
        {entry.koreanExplanation && (
          <section className="mb-12 transform hover:scale-[1.01] transition-transform">
            <div className="relative">
              {/* Masking tape - vintage style */}
              <div className="absolute -top-4 left-16 w-28 h-8 bg-orange-200/50 rounded-sm shadow-md transform -rotate-2 border border-orange-300/40">
                <div className="w-full h-full opacity-20 bg-gradient-to-r from-transparent via-orange-900/10 to-transparent" />
              </div>

              <div className="torn-paper p-6 relative bg-amber-50/30">
                <h2 className="text-sm font-semibold text-amber-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Lightbulb className="h-4 w-4 text-amber-700" />
                  <span>설명</span>
                </h2>
                <p className="text-base leading-7 text-amber-900 whitespace-pre-wrap">
                  {entry.koreanExplanation}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Alternatives */}
        {entry.alternatives && entry.alternatives.length > 0 && (
          <section className="mb-12 transform hover:scale-[1.01] transition-transform">
            <div className="relative">
              {/* Masking tape - vintage style */}
              <div className="absolute -top-4 right-16 w-28 h-8 bg-blue-200/50 rounded-sm shadow-md transform rotate-2 border border-blue-300/40">
                <div className="w-full h-full opacity-20 bg-gradient-to-r from-transparent via-blue-900/10 to-transparent" />
              </div>

              <div className="torn-paper p-6 relative bg-blue-50/20">
                <h2 className="text-sm font-semibold text-blue-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span>다른 표현</span>
                </h2>
                <div className="space-y-4">
                  {entry.alternatives.map((alt, index) => (
                    <div key={index} className="bg-white/60 rounded p-4 border border-amber-800/20 shadow-sm">
                      <Badge variant="secondary" className="mb-2 text-xs bg-blue-100/50 text-blue-900 border-blue-300/40">
                        {alt.type}
                      </Badge>
                      <SelectableText sourceType="diary" sourceId={entry.chatId}>
                        <p className="text-base text-amber-900" style={{ fontFamily: "'Georgia', serif" }}>
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
          <section className="mb-12 transform hover:scale-[1.01] transition-transform">
            <div className="relative">
              {/* Masking tape - vintage style */}
              <div className="absolute -top-4 left-20 w-28 h-8 bg-purple-200/50 rounded-sm shadow-md transform -rotate-1 border border-purple-300/40">
                <div className="w-full h-full opacity-20 bg-gradient-to-r from-transparent via-purple-900/10 to-transparent" />
              </div>

              <div className="torn-paper p-6 relative bg-purple-50/20">
                <h2 className="text-sm font-semibold text-purple-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <span className="text-base">💡</span>
                  <span>팁</span>
                </h2>
                <p className="text-base leading-7 text-amber-900">
                  {entry.insight}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-4 pt-8 pb-4 border-t-2 border-amber-900/20">
          <Button asChild variant="outline" className="rounded-full border-2 border-amber-800/40 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 shadow-md">
            <Link href="/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-amber-800 hover:bg-amber-900 text-white shadow-lg">
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
