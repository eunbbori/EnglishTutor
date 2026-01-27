"use client";

import { cn } from "@/lib/utils";
import { getHeatmapLevel, isToday } from "@/lib/calendar/utils";
import { getMoodEmoji } from "./mood-selector";
import type { CalendarEntryData } from "@/app/api/calendar/[year]/[month]/route";

interface CalendarDayProps {
  date: string; // YYYY-MM-DD
  day: number;
  entry?: CalendarEntryData;
  onClick?: (date: string, entry?: CalendarEntryData) => void;
  isCurrentMonth?: boolean;
}

// 디자인 시스템 색상 매핑 (히트맵 레벨별)
const getDesignSystemHeatmapColor = (level: number): string => {
  switch (level) {
    case 1:
      return "bg-ds-pastel-yellow/40 border-ds-pastel-yellow";
    case 2:
      return "bg-ds-pastel-mint/50 border-ds-pastel-mint";
    case 3:
      return "bg-ds-pastel-coral/50 border-ds-pastel-coral";
    case 4:
      return "bg-ds-pastel-lavender/60 border-ds-pastel-lavender";
    default:
      return "bg-white border-ds-border-light";
  }
};

export function CalendarDay({
  date,
  day,
  entry,
  onClick,
  isCurrentMonth = true,
}: CalendarDayProps) {
  const heatmapLevel = entry ? getHeatmapLevel(entry.wordCount) : 0;
  const heatmapColor = getDesignSystemHeatmapColor(heatmapLevel);
  const isTodayDate = isToday(date);
  const moodEmoji = entry?.mood ? getMoodEmoji(entry.mood) : null;

  return (
    <button
      onClick={() => onClick?.(date, entry)}
      className={cn(
        "relative aspect-square w-full rounded-full border-[3px] transition-smooth",
        "flex flex-col items-center justify-center gap-1 py-2",
        "shadow-md hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ds-accent-primary focus:ring-offset-2",
        heatmapColor,
        isTodayDate && "ring-[3px] ring-ds-accent-primary ring-offset-2 shadow-lg scale-105",
        !isCurrentMonth && "opacity-40",
        entry ? "cursor-pointer hover:scale-110" : "cursor-default",
      )}
      disabled={!isCurrentMonth}
      aria-label={`${date}${entry ? ", 일기 있음" : ""}`}
    >
      {/* Mood emoji (top-right corner) */}
      {moodEmoji && (
        <span className="absolute -top-2 -right-2 text-xl leading-none z-10 bg-white rounded-full p-0.5 shadow-sm">
          {moodEmoji}
        </span>
      )}

      {/* Day number */}
      <span
        className={cn(
          "text-xl font-bold",
          isTodayDate ? "text-ds-accent-primary font-extrabold text-2xl" : "text-ds-text-primary",
          !isCurrentMonth && "text-ds-text-muted"
        )}
      >
        {day}
      </span>

      {/* Keyword preview (if available) */}
      {entry?.keywords && entry.keywords.length > 0 && (
        <span className="text-[10px] text-ds-text-secondary truncate max-w-full px-1 font-medium">
          {entry.keywords[0]}
        </span>
      )}
    </button>
  );
}

interface EmptyDayCellProps {
  className?: string;
}

export function EmptyDayCell({ className }: EmptyDayCellProps) {
  return (
    <div
      className={cn(
        "aspect-square w-full rounded-full bg-ds-bg-secondary/30 border-[3px] border-ds-border-light/40",
        className
      )}
    />
  );
}
