"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  X,
  Pencil,
  RotateCw,
  Lightbulb,
} from "lucide-react";
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
  onSubmit: (
    text: string,
    promptId: string | null,
    mood: string | null,
  ) => void;
  isLoading?: boolean;
}

const SHUFFLE_LIMIT = 3;
const STORAGE_KEY = "diary_shuffle_data";

interface ShuffleData {
  date: string;
  count: number;
}

/**
 * Input validation rules to prevent abuse
 */
interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

function validateDiaryInput(text: string): ValidationResult {
  const trimmed = text.trim();

  // 1. Empty text check
  if (trimmed.length === 0) {
    return { isValid: false, errorMessage: null }; // No message needed, button is disabled
  }

  // 2. Minimum character count (20 chars excluding spaces)
  const textWithoutSpaces = trimmed.replace(/\s/g, "");
  if (textWithoutSpaces.length < 20) {
    return { isValid: false, errorMessage: "조금 더 써볼까요? (공백 제외 20자 이상)" };
  }

  // 3. Minimum word count (5 words)
  const words = trimmed.split(/\s+/);
  if (words.length < 5) {
    return { isValid: false, errorMessage: "문장을 조금 더 만들어보세요! (5단어 이상)" };
  }

  // 4. Repeated character detection (5+ consecutive)
  const repeatedCharPattern = /(.)\1{4,}/;
  if (repeatedCharPattern.test(trimmed)) {
    return { isValid: false, errorMessage: "의미 있는 영어 문장을 써주세요." };
  }

  // 5. Repeated word detection (70%+ same word)
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    const normalized = word.toLowerCase();
    wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
  });

  for (const [word, count] of wordCounts) {
    if (count / words.length >= 0.7) {
      return { isValid: false, errorMessage: "다양한 단어로 일기를 써보세요!" };
    }
  }

  return { isValid: true, errorMessage: null };
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
    prompts.find((p) => p.id === defaultPromptId) || prompts[0] || null,
  );
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [mode, setMode] = useState<DiaryMode>("free");

  // Get today's word for challenge mode
  const todayWord = getTodayWord();
  const wordUsed =
    mode === "challenge" ? checkWordUsage(text, todayWord.word) : false;

  // Input validation
  const validation = validateDiaryInput(text);

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

  // Ensure selectedPrompt is always set
  useEffect(() => {
    if (!selectedPrompt && prompts.length > 0) {
      setSelectedPrompt(
        prompts.find((p) => p.id === defaultPromptId) || prompts[0],
      );
    }
  }, [selectedPrompt, prompts, defaultPromptId]);

  const handleSubmit = () => {
    if (!validation.isValid || isLoading) return;
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

  // Free Mode: Change inspiration (unlimited)
  const changeInspiration = () => {
    setIsShuffling(true);

    // Get a random prompt different from current one
    const availablePrompts = prompts.filter((p) => p.id !== selectedPrompt?.id);
    const randomPrompt =
      availablePrompts[Math.floor(Math.random() * availablePrompts.length)];

    // Animate and update
    setTimeout(() => {
      setSelectedPrompt(randomPrompt);
      setIsShuffling(false);
    }, 300);
  };

  // Challenge Mode: Shuffle prompt (3 times limit)
  const shufflePrompt = () => {
    if (shuffleCount >= SHUFFLE_LIMIT || !selectedPrompt) return;

    setIsShuffling(true);

    // Get a random prompt different from current one
    const availablePrompts = prompts.filter((p) => p.id !== selectedPrompt.id);
    const randomPrompt =
      availablePrompts[Math.floor(Math.random() * availablePrompts.length)];

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
      return `Try to use the word "${todayWord.word}" naturally in your writing. Write about anything you want...`;
    }
    // Free mode - always show inspiration hint placeholder
    return (
      selectedPrompt?.placeholder ||
      "How was your day? Write about what happened today..."
    );
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Diary Header - Date Stamp Style - Responsive */}
      <div className="flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
        <div className="relative">
          {/* Date stamp - Responsive sizing */}
          <div className="bg-white border-2 border-ds-border-light rounded-xl sm:rounded-2xl px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 shadow-card">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide sm:tracking-wider text-ds-text-muted font-medium">
                {month} {year}
              </p>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-handwriting font-bold text-ds-accent-primary my-1 sm:my-1.5 lg:my-2 leading-none">
                {day}
              </p>
              <p className="text-xs sm:text-sm text-ds-text-secondary font-medium">
                {weekday}
              </p>
            </div>
          </div>
          {/* Decorative pin - Responsive */}
          <div className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full shadow-md border-2 border-red-300" />
        </div>
      </div>

      {/* Mode Selector - Responsive */}
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <ModeSelector mode={mode} onModeChange={setMode} disabled={isLoading} />
      </div>

      {/* Mood Selector - Responsive */}
      <div className="mb-4 sm:mb-5 lg:mb-6 flex justify-center">
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

      {/* Inspiration Hint (Free Mode only) - Responsive */}
      {mode === "free" && (
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-ds-bg-secondary border-2 border-ds-border-light rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-ds-pastel-yellow/40 rounded-lg border border-ds-pastel-yellow flex-shrink-0">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-ds-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                  <span className="text-xs sm:text-sm font-medium text-ds-text-secondary">
                    오늘의 주제
                  </span>
                  <button
                    onClick={changeInspiration}
                    disabled={isShuffling}
                    className="text-[11px] sm:text-xs text-ds-accent-primary hover:text-ds-accent-hover active:text-ds-accent-hover flex items-center gap-1 transition-smooth disabled:opacity-40 font-medium touch-manipulation min-h-[44px] -my-2"
                    aria-label="다른 주제 찾기"
                  >
                    <RotateCw
                      className={`h-3 w-3 ${isShuffling ? "animate-spin" : ""}`}
                    />
                    <span className="hidden xs:inline">다른 주제 찾기</span>
                    <span className="xs:hidden">변경</span>
                  </button>
                </div>
                <p
                  className={`text-ds-text-primary font-semibold text-sm sm:text-base transition-opacity ${isShuffling ? "opacity-50" : "opacity-100"} leading-snug`}
                >
                  {selectedPrompt?.title || "오늘 하루 어땠나요?"}
                </p>
                {/* <p className="text-[11px] sm:text-xs text-ds-text-muted mt-1.5 sm:mt-2 leading-relaxed">
                  주제 상관없이 자유롭게 쓰셔도 돼요!
                </p> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diary Paper - Responsive */}
      <div className="relative">
        {/* Paper background */}
        <div
          className="bg-[#fffef9] dark:bg-[#1c1917] rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
          style={{
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {/* Red margin line - Responsive */}
          <div className="absolute left-8 sm:left-10 lg:left-12 top-0 bottom-0 w-[1px] bg-red-200/60 dark:bg-red-900/40" />

          {/* Notebook lines - Responsive */}
          <div
            className="absolute inset-0 pointer-events-none hidden sm:block"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 31px, #e8e4d9 31px, #e8e4d9 32px)",
              backgroundPosition: "0 20px",
            }}
          />

          {/* Hole punches decoration - Hide on mobile */}
          <div className="hidden sm:block absolute left-3 top-8 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />
          <div className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />
          <div className="hidden sm:block absolute left-3 bottom-8 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 shadow-inner" />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="w-full min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] pl-10 sm:pl-14 lg:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 text-base sm:text-lg leading-7 sm:leading-8 resize-none bg-transparent relative z-10 focus:outline-none placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600 text-zinc-800 dark:text-zinc-200"
            style={{
              fontFamily: "'Georgia', 'Noto Serif KR', serif",
              lineHeight: "28px",
            }}
            disabled={isLoading}
          />
        </div>

        {/* Paper edge shadow */}
        <div className="absolute -bottom-1 left-2 right-2 h-2 bg-gradient-to-b from-zinc-100/50 to-transparent dark:from-zinc-800/30 rounded-b-xl" />
      </div>

      {/* Footer - Responsive */}
      <div className="flex justify-between items-center mt-3 sm:mt-4 px-1">
        <div className="flex-1">
          {validation.errorMessage ? (
            <p className="text-xs sm:text-sm text-red-500 font-medium">
              {validation.errorMessage}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-ds-text-muted">
              {text.length > 0 && <span>{text.length}자</span>}
            </p>
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-ds-text-muted hidden sm:block">
          ⌘ + Enter
        </p>
      </div>

      {/* Submit Button - HIG: Prominent CTA with adequate touch target */}
      <div className="mt-4 sm:mt-5 lg:mt-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!validation.isValid || isLoading}
          size="lg"
          className="w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 gap-2 rounded-full bg-ds-accent-primary hover:bg-ds-accent-hover active:scale-95 text-white shadow-card font-semibold text-base sm:text-lg touch-manipulation transition-transform min-h-[48px] sm:min-h-[52px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 sm:h-5 sm:w-5 animate-spin" />
              교정 중...
            </>
          ) : (
            <>
              <Pencil className="h-5 w-5 sm:h-5 sm:w-5" />
              교정받기
            </>
          )}
        </Button>
      </div>

      {/* Encouragement - Responsive */}
      <p className="text-center text-xs sm:text-sm text-ds-text-muted mt-3 sm:mt-4 lg:mt-5 px-4">
        틀려도 괜찮아요! 매일 쓰는 게 중요해요 ✨
      </p>
    </div>
  );
}
