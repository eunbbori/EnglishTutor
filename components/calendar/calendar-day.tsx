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
        // HIG: Minimum 44pt touch target, responsive sizing
        "relative aspect-square w-full min-h-[44px] rounded-full border-2 sm:border-[3px] transition-smooth",
        "flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1.5 sm:py-2",
        "shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg active:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ds-accent-primary focus:ring-offset-1 sm:focus:ring-offset-2",
        "touch-manipulation", // HIG: Optimize for touch
        heatmapColor,
        isTodayDate && "ring-2 sm:ring-[3px] ring-ds-accent-primary ring-offset-1 sm:ring-offset-2 shadow-md sm:shadow-lg scale-[1.02] sm:scale-105",
        !isCurrentMonth && "opacity-40",
        entry ? "cursor-pointer active:scale-95 sm:hover:scale-110" : "cursor-default",
      )}
      disabled={!isCurrentMonth}
      aria-label={`${date}${entry ? ", 일기 있음" : ""}`}
    >
      {/* Mood emoji - Responsive size */}
      {moodEmoji && (
        <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 text-base sm:text-xl leading-none z-10 bg-white rounded-full p-0.5 shadow-sm">
          {moodEmoji}
        </span>
      )}

      {/* Day number - Responsive typography */}
      <span
        className={cn(
          "text-base sm:text-lg md:text-xl font-bold leading-none",
          isTodayDate ? "text-ds-accent-primary font-extrabold text-lg sm:text-xl md:text-2xl" : "text-ds-text-primary",
          !isCurrentMonth && "text-ds-text-muted"
        )}
      >
        {day}
      </span>

      {/* Keyword preview - Hide on very small screens */}
      {entry?.keywords && entry.keywords.length > 0 && (
        <span className="hidden xs:block text-[9px] sm:text-[10px] text-ds-text-secondary truncate max-w-full px-0.5 sm:px-1 font-medium leading-tight">
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
