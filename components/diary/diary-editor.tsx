"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Send, Loader2, ChevronDown, X, Pencil, RotateCw } from "lucide-react";
import { MoodSelector } from "@/components/calendar/mood-selector";
import { ModeSelector, DiaryMode } from "./mode-selector";
import { DailyMission } from "./daily-mission";
import { getTodayWord, checkWordUsage } from "@/lib/missions";

export interface DiaryPrompt {
  id: string;
  title: string;
  placeholder: string;
}

interface DiaryEditorProps {
  prompts: DiaryPrompt[];
  defaultPromptId?: string;
  onSubmit: (text: string, promptId: string | null, mood: string | null) => void;
  isLoading?: boolean;
}

const SHUFFLE_LIMIT = 3;
const STORAGE_KEY = "diary_shuffle_data";

interface ShuffleData {
  date: string;
  count: number;
}

export function DiaryEditor({
  prompts,
  defaultPromptId,
  onSubmit,
  isLoading = false,
}: DiaryEditorProps) {
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<DiaryPrompt | null>(
    prompts.find((p) => p.id === defaultPromptId) || prompts[0] || null
  );
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [mode, setMode] = useState<DiaryMode>("free");

  // Get today's word for challenge mode
  const todayWord = getTodayWord();
  const wordUsed = mode === "challenge" ? checkWordUsage(text, todayWord.word) : false;

  // Load shuffle count from localStorage on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const data: ShuffleData = JSON.parse(stored);
        if (data.date === today) {
          setShuffleCount(data.count);
        } else {
          // New day, reset count
          const newData: ShuffleData = { date: today, count: 0 };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          setShuffleCount(0);
        }
      } catch {
        // Invalid data, reset
        const newData: ShuffleData = { date: today, count: 0 };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setShuffleCount(0);
      }
    } else {
      // No data, initialize
      const newData: ShuffleData = { date: today, count: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setShuffleCount(0);
    }
  }, []);

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text, selectedPrompt?.id || null, selectedMood);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearPrompt = () => {
    setSelectedPrompt(null);
  };

  const shufflePrompt = () => {
    if (shuffleCount >= SHUFFLE_LIMIT || !selectedPrompt) return;

    setIsShuffling(true);

    // Get a random prompt different from current one
    const availablePrompts = prompts.filter((p) => p.id !== selectedPrompt.id);
    const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];

    // Animate and update
    setTimeout(() => {
      setSelectedPrompt(randomPrompt);
      setIsShuffling(false);

      // Update shuffle count
      const newCount = shuffleCount + 1;
      setShuffleCount(newCount);

      const today = new Date().toDateString();
      const newData: ShuffleData = { date: today, count: newCount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }, 300);
  };

  // Get today's date
  const today = new Date();
  const month = today.toLocaleDateString("en-US", { month: "short" });
  const day = today.getDate();
  const weekday = today.toLocaleDateString("ko-KR", { weekday: "long" });
  const year = today.getFullYear();

  // Placeholder text based on mode
  const getPlaceholder = () => {
    if (mode === "challenge") {
      return `Try to use the word "${todayWord.word}" in your writing today...`;
    }
    return selectedPrompt?.placeholder || "Write freely about anything on your mind today...";
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Diary Header - Date Stamp Style */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          {/* Date stamp */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-200/60 dark:border-amber-800/60 rounded-2xl px-8 py-4 shadow-sm">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-medium">
                {month} {year}
              </p>
              <p className="text-5xl font-light text-amber-800 dark:text-amber-200 my-1">
                {day}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {weekday}
              </p>
            </div>
          </div>
          {/* Decorative pin */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-400 dark:bg-red-500 rounded-full shadow-md border-2 border-red-300 dark:border-red-400" />
        </div>
      </div>

      {/* Mode Selector */}
      <div className="mb-6">
        <ModeSelector mode={mode} onModeChange={setMode} disabled={isLoading} />
      </div>

      {/* Mood Selector */}
      <div className="mb-6 flex justify-center">
        <MoodSelector
          selectedMood={selectedMood}
          onSelect={setSelectedMood}
          disabled={isLoading}
        />
      </div>

      {/* Daily Mission (Challenge Mode) */}
      {mode === "challenge" && (
        <DailyMission word={todayWord} isCompleted={wordUsed} />
      )}

      {/* Topic Selector (Free Mode only) */}
      {mode === "free" && (
        <div className="mb-6">
          {selectedPrompt ? (
            <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        오늘의 주제
                      </span>
                      <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-0.5 transition-colors">
                              변경 <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            {prompts.map((prompt) => (
                              <DropdownMenuItem
                                key={prompt.id}
                                onClick={() => setSelectedPrompt(prompt)}
                                className={selectedPrompt?.id === prompt.id ? "bg-accent" : ""}
                              >
                                {prompt.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="text-amber-300 dark:text-amber-700">•</span>
                        <button
                          onClick={shufflePrompt}
                          disabled={shuffleCount >= SHUFFLE_LIMIT || isShuffling}
                          className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-0.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            shuffleCount >= SHUFFLE_LIMIT
                              ? "오늘의 셔플 기회를 모두 사용했어요"
                              : `랜덤 주제로 바꾸기 (${SHUFFLE_LIMIT - shuffleCount}회 남음)`
                          }
                        >
                          <RotateCw className={`h-3 w-3 ${isShuffling ? "animate-spin" : ""}`} />
                          셔플 {shuffleCount >= SHUFFLE_LIMIT ? "" : `(${SHUFFLE_LIMIT - shuffleCount})`}
                        </button>
                      </div>
                    </div>
                    <p className={`text-amber-900 dark:text-amber-100 font-medium transition-opacity ${isShuffling ? "opacity-50" : "opacity-100"}`}>
                      {selectedPrompt.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearPrompt}
                  className="p-1.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
                  title="자유 주제로 변경"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">자유롭게 쓰기</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    주제 선택하기 <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {prompts.map((prompt) => (
                    <DropdownMenuItem
                      key={prompt.id}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      {prompt.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      {/* Diary Paper */}
      <div className="relative">
        {/* Paper background */}
        <div
          className="bg-[#fffef9] dark:bg-[#1c1917] rounded-2xl shadow-lg overflow-hidden"
          style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {/* Red margin line */}
          <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-red-200/60 dark:bg-red-900/40" />

          {/* Notebook lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 31px, #e8e4d9 31px, #e8e4d9 32px)",
              backgroundPosition: "0 20px",
            }}
          />

          {/* Hole punches decoration */}
          <div className="absolute left-3 top-8 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />
          <div className="absolute left-3 bottom-8 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="w-full min-h-[320px] pl-16 pr-6 py-5 text-lg leading-8 resize-none bg-transparent relative z-10 focus:outline-none placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600 text-zinc-800 dark:text-zinc-200"
            style={{
              fontFamily: "'Georgia', 'Noto Serif KR', serif",
              lineHeight: "32px",
            }}
            disabled={isLoading}
          />
        </div>

        {/* Paper edge shadow */}
        <div className="absolute -bottom-1 left-2 right-2 h-2 bg-gradient-to-b from-zinc-100/50 to-transparent dark:from-zinc-800/30 rounded-b-xl" />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 px-1">
        <p className="text-sm text-muted-foreground">
          {text.length > 0 && <span>{text.length}자</span>}
        </p>
        <p className="text-xs text-muted-foreground">⌘ + Enter</p>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          size="lg"
          className="px-10 gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              교정 중...
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              교정받기
            </>
          )}
        </Button>
      </div>

      {/* Encouragement */}
      <p className="text-center text-sm text-muted-foreground mt-5">
        틀려도 괜찮아요! 매일 쓰는 게 중요해요 ✨
      </p>
    </div>
  );
}
