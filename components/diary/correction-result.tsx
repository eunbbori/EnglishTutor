"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  PenLine,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface Alternative {
  type: string;
  text: string;
}

interface CorrectionData {
  originalText: string;
  correctedText: string;
  koreanExplanation: string;
  alternatives: Alternative[];
  mistakeType?: string | null;
  insight?: string;
}

interface CorrectionResultProps {
  data: CorrectionData;
  onNewEntry: () => void;
}

export function CorrectionResult({ data, onNewEntry }: CorrectionResultProps) {
  const {
    originalText,
    correctedText,
    koreanExplanation,
    alternatives,
    mistakeType,
    insight,
  } = data;

  // Check if there were any corrections made
  const hasCorrections = originalText.toLowerCase().trim() !== correctedText.toLowerCase().trim();

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-1">교정 완료!</h2>
        <p className="text-muted-foreground">{dateString}의 일기</p>
      </div>

      {/* Original & Corrected Comparison */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          {/* Original Text */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border-b">
            <div className="flex items-center gap-2 mb-3">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">내가 쓴 문장</span>
            </div>
            <p className="text-lg leading-relaxed">{originalText}</p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-3 relative z-10">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <ArrowRight className="h-4 w-4 rotate-90" />
            </div>
          </div>

          {/* Corrected Text */}
          <div className="p-5 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {hasCorrections ? "교정된 문장" : "잘 쓴 문장!"}
              </span>
              {!hasCorrections && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Perfect!
                </Badge>
              )}
            </div>
            <p className="text-lg leading-relaxed text-green-900 dark:text-green-100">
              {correctedText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Korean Explanation */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium mb-2">설명</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {koreanExplanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insight (if recurring mistake) */}
      {insight && (
        <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium mb-2 text-amber-800 dark:text-amber-300">
                  학습 팁
                </h3>
                <p className="text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                  {insight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Expressions */}
      {alternatives && alternatives.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-5">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              이렇게도 표현할 수 있어요
            </h3>
            <div className="space-y-3">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg"
                >
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {alt.type}
                  </Badge>
                  <p className="text-sm leading-relaxed">{alt.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Entry Button */}
      <div className="flex justify-center">
        <Button onClick={onNewEntry} size="lg" variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          새 일기 쓰기
        </Button>
      </div>

      {/* Encouragement */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        오늘도 영어 일기 완료! 내일도 함께해요 🎉
      </p>
    </div>
  );
}
