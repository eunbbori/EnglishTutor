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
    <div className="flex flex-col gap-2">
      <label className="text-sm text-muted-foreground">오늘의 기분은?</label>
      <div className="flex gap-2 flex-wrap">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(mood.id)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
              "hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedMood === mood.id
                ? "border-amber-400 bg-amber-100 dark:bg-amber-900/40"
                : "border-border bg-background"
            )}
            title={mood.label}
          >
            <span className="text-lg">{mood.emoji}</span>
            <span className="text-xs text-muted-foreground">{mood.label}</span>
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
