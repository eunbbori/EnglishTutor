"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, CheckCircle2 } from "lucide-react";

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
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">나의 일기 기록</h1>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              아직 작성한 일기가 없어요.
            </p>
            <Button asChild>
              <Link href="/">첫 일기 쓰러 가기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.createdAt)}
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      교정 완료
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Original Text */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">원문</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">
                      {entry.originalText}
                    </p>
                  </div>

                  {/* Corrected Text */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">교정 결과</p>
                    <p className="text-sm bg-primary/5 p-2 rounded border border-primary/20">
                      {entry.correctedText}
                    </p>
                  </div>

                  {/* Korean Explanation (truncated) */}
                  {entry.koreanExplanation && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">설명</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.koreanExplanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            최근 50개의 일기를 표시합니다
          </p>
        )}
      </main>
    </div>
  );
}
