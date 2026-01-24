"use client";

import { cn } from "@/lib/utils";
import { getHeatmapLevel, getHeatmapColorClass, isToday } from "@/lib/calendar/utils";
import { getMoodEmoji } from "./mood-selector";
import type { CalendarEntryData } from "@/app/api/calendar/[year]/[month]/route";

interface CalendarDayProps {
  date: string; // YYYY-MM-DD
  day: number;
  entry?: CalendarEntryData;
  onClick?: (date: string, entry?: CalendarEntryData) => void;
  isCurrentMonth?: boolean;
}

export function CalendarDay({
  date,
  day,
  entry,
  onClick,
  isCurrentMonth = true,
}: CalendarDayProps) {
  const heatmapLevel = entry ? getHeatmapLevel(entry.wordCount) : 0;
  const heatmapColor = getHeatmapColorClass(heatmapLevel);
  const isTodayDate = isToday(date);
  const moodEmoji = entry?.mood ? getMoodEmoji(entry.mood) : null;

  return (
    <button
      onClick={() => onClick?.(date, entry)}
      className={cn(
        "relative aspect-square w-full rounded-lg border transition-all",
        "flex flex-col items-center justify-center gap-0.5",
        "hover:border-amber-300 hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1",
        heatmapColor,
        isTodayDate && "ring-2 ring-amber-500 ring-offset-1",
        !isCurrentMonth && "opacity-40",
        entry ? "cursor-pointer" : "cursor-default"
      )}
      disabled={!isCurrentMonth}
      aria-label={`${date}${entry ? ", 일기 있음" : ""}`}
    >
      {/* Mood emoji (top-right corner) */}
      {moodEmoji && (
        <span className="absolute top-0.5 right-0.5 text-xs leading-none">
          {moodEmoji}
        </span>
      )}

      {/* Day number */}
      <span
        className={cn(
          "text-sm font-medium",
          isTodayDate && "text-amber-700 dark:text-amber-300",
          !isCurrentMonth && "text-muted-foreground"
        )}
      >
        {day}
      </span>

      {/* Keyword preview (if available) */}
      {entry?.keywords && entry.keywords.length > 0 && (
        <span className="text-[9px] text-muted-foreground truncate max-w-full px-0.5">
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
        "aspect-square w-full rounded-lg bg-muted/20",
        className
      )}
    />
  );
}
