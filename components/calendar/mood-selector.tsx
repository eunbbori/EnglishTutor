"use client";

import { cn } from "@/lib/utils";

export interface Mood {
  id: string;
  emoji: string;
  label: string;
}

export const MOODS: Mood[] = [
  { id: "happy", emoji: "😊", label: "좋음" },
  { id: "neutral", emoji: "😐", label: "보통" },
  { id: "sad", emoji: "😢", label: "슬픔" },
  { id: "excited", emoji: "🤩", label: "신남" },
  { id: "tired", emoji: "😴", label: "피곤" },
  { id: "anxious", emoji: "😰", label: "불안" },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelect: (moodId: string) => void;
  disabled?: boolean;
}

export function MoodSelector({ selectedMood, onSelect, disabled }: MoodSelectorProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      <label className="text-xs sm:text-sm text-ds-text-secondary font-medium text-center sm:text-left">
        오늘의 기분은?
      </label>
      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(mood.id)}
            disabled={disabled}
            className={cn(
              // HIG: 44pt minimum touch target
              "flex flex-col items-center gap-0.5 sm:gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border-2 transition-smooth shadow-sm",
              "touch-manipulation min-h-[44px] min-w-[44px]",
              "hover:border-ds-pastel-yellow hover:bg-ds-pastel-yellow/30",
              "active:border-ds-pastel-yellow active:bg-ds-pastel-yellow/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedMood === mood.id
                ? "border-ds-pastel-yellow bg-ds-pastel-yellow/50 shadow-md scale-105"
                : "border-ds-border-light bg-white"
            )}
            title={mood.label}
            aria-label={mood.label}
          >
            <span className="text-lg sm:text-xl leading-none">{mood.emoji}</span>
            <span className="text-[10px] sm:text-xs text-ds-text-secondary font-medium hidden xs:block leading-none">
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Get mood by ID
 */
export function getMoodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}

/**
 * Get mood emoji by ID
 */
export function getMoodEmoji(id: string): string {
  return getMoodById(id)?.emoji || "";
}
