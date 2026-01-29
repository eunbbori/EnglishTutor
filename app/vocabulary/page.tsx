"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Trash2,
  Search,
  Loader2,
  ArrowLeft,
  Pin,
} from "lucide-react";
import Link from "next/link";

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string | null;
  example: string | null;
  context: string | null;
  memo: string | null;
  sourceType: string;
  createdAt: string;
}

export default function VocabularyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch vocabulary
  useEffect(() => {
    if (status === "authenticated") {
      fetchVocabulary();
    }
  }, [status]);

  const fetchVocabulary = async () => {
    try {
      const response = await fetch("/api/vocabulary");
      if (response.ok) {
        const data = await response.json();
        setWords(data.words);
      }
    } catch (error) {
      console.error("Failed to fetch vocabulary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("이 표현을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/vocabulary/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWords(words.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete word:", error);
    }
  };

  // Filter words by search query
  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen vintage-bg relative overflow-hidden">
      {/* Vintage Paper Texture Overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Main Container - Responsive */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {/* Back Button - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 sm:gap-2 touch-manipulation min-h-[44px] text-ds-text-secondary hover:text-ds-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm sm:text-base">돌아가기</span>
            </Button>
          </Link>
        </div>

        {/* Notebook Header - Binder Rings Style */}
        <div className="relative mb-6 sm:mb-8 lg:mb-10">
          {/* Title Label - Masking Tape Style - Responsive */}
          <div className="relative mt-4 sm:mt-6 lg:mt-8 flex justify-center">
            <div className="relative bg-[#F5EDD6] border-2 border-[#D4C5B0] rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 shadow-md transform -rotate-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-ds-text-primary" />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-handwriting font-bold text-ds-text-primary">
                  나만의 표현노트
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-ds-text-muted text-center mt-0.5 sm:mt-1">
                저장한 표현 {words.length}개
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar - Responsive */}
        <div className="relative mb-6 sm:mb-8">
          <div className="relative bg-white/90 backdrop-blur-sm border-2 border-ds-border-light rounded-xl shadow-sm">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-ds-text-muted" />
            <Input
              placeholder="표현 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base bg-transparent border-0 focus-visible:ring-0 touch-manipulation"
            />
          </div>
        </div>

        {/* Word List */}
        {filteredWords.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-ds-border-light rounded-2xl p-8 sm:p-12 text-center shadow-card">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-ds-text-muted" />
            <p className="text-ds-text-secondary text-base sm:text-lg">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "아직 저장한 표현이 없습니다"}
            </p>
            {!searchQuery && (
              <p className="text-sm sm:text-base text-ds-text-muted mt-3 sm:mt-4">
                일기를 쓰면서 텍스트를 드래그하여 표현을 저장해보세요.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 lg:gap-6">
            {filteredWords.map((word, index) => (
              <div
                key={word.id}
                className="relative group"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                {/* Pin Decoration - Responsive */}
                <div className="absolute -top-2 sm:-top-3 right-4 sm:right-6 z-20">
                  <Pin className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 fill-red-400 transform rotate-45 drop-shadow-md" />
                </div>

                {/* Card - Sticky Note Style - Responsive */}
                <div
                  className="relative bg-gradient-to-br from-[#FFFEF9] to-[#F5F1E8] border-2 border-[#E8DFD0] rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  style={{
                    transform: `rotate(${index % 2 === 0 ? "0.5deg" : "-0.5deg"})`,
                  }}
                >
                  {/* Card Inner Shadow */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                  <div className="relative flex items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Word Title - Responsive */}
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ds-text-primary break-words">
                          {word.word}
                        </h3>
                        {word.sourceType === "manual" && (
                          <Badge
                            variant="outline"
                            className="text-xs border-ds-border-default text-ds-text-secondary shrink-0"
                          >
                            직접 추가
                          </Badge>
                        )}
                      </div>

                      {/* Meaning - Responsive */}
                      {word.meaning && (
                        <p className="text-sm sm:text-base text-ds-text-secondary mb-2 sm:mb-3 leading-relaxed">
                          {word.meaning}
                        </p>
                      )}

                      {/* Context/Example - Responsive */}
                      {(word.context || word.example) && (
                        <div className="bg-white/60 border border-ds-border-light rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                          {word.context && (
                            <div className="text-[10px] sm:text-xs text-ds-text-muted mb-1 sm:mb-1.5 font-medium uppercase tracking-wide">
                              내가 쓴 문장
                            </div>
                          )}
                          <p className="text-xs sm:text-sm text-ds-text-primary italic leading-relaxed break-words">
                            "{word.context || word.example}"
                          </p>
                        </div>
                      )}

                      {/* Memo - Responsive */}
                      {word.memo && (
                        <div className="flex items-start gap-1.5 sm:gap-2 mb-2">
                          <span className="text-base sm:text-lg shrink-0">
                            📝
                          </span>
                          <p className="text-xs sm:text-sm text-ds-text-muted leading-relaxed break-words">
                            {word.memo}
                          </p>
                        </div>
                      )}

                      {/* Date - Responsive */}
                      <p className="text-[10px] sm:text-xs text-ds-text-muted mt-2 sm:mt-3">
                        {new Date(word.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Delete Button - HIG Touch Target */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWord(word.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 touch-manipulation min-h-[44px] min-w-[44px] -mr-2"
                      aria-label="표현 삭제"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
