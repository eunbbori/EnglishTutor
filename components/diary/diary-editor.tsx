"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Send, Loader2 } from "lucide-react";

interface DiaryEditorProps {
  todayPrompt: string;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export function DiaryEditor({ todayPrompt, onSubmit, isLoading = false }: DiaryEditorProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to submit
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Get today's date in Korean format
  const today = new Date();
  const dateString = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Date Header */}
      <div className="text-center mb-6">
        <p className="text-2xl font-semibold text-foreground">{dateString}</p>
        <p className="text-sm text-muted-foreground mt-1">오늘의 일기</p>
      </div>

      {/* Today's Prompt Card */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
              오늘의 주제
            </p>
            <p className="text-amber-900 dark:text-amber-100">{todayPrompt}</p>
          </div>
        </div>
      </div>

      {/* Diary Editor */}
      <div className="relative">
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-hidden">
          {/* Notebook lines effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e5e5e5 31px, #e5e5e5 32px)",
              backgroundPosition: "0 16px",
            }}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your diary in English... (영어로 오늘 하루를 적어보세요)"
            className="w-full min-h-[280px] p-6 text-lg leading-8 resize-none bg-transparent relative z-10 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            disabled={isLoading}
          />
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm text-muted-foreground">
            {text.length > 0 ? `${text.length}자` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            ⌘ + Enter로 제출
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          size="lg"
          className="px-8 gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              교정 중...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              교정받기
            </>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        틀려도 괜찮아요! AI가 자연스러운 표현으로 고쳐줄 거예요 ✨
      </p>
    </div>
  );
}
