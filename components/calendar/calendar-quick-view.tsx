"use client";

import { X, ExternalLink, PenLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMoodById } from "./mood-selector";
import { isToday } from "@/lib/calendar/utils";
import type { CalendarEntryData } from "@/app/api/calendar/[year]/[month]/route";

interface CalendarQuickViewProps {
  date: string; // YYYY-MM-DD
  entry: CalendarEntryData | null;
  onClose: () => void;
  onWriteToday?: () => void;
}

export function CalendarQuickView({
  date,
  entry,
  onClose,
  onWriteToday,
}: CalendarQuickViewProps) {
  const isTodayDate = isToday(date);
  const mood = entry?.mood ? getMoodById(entry.mood) : null;

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${parseInt(month)}월 ${parseInt(day)}일`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto p-4">
        <div className="bg-background border rounded-t-2xl shadow-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{formatDisplayDate(date)}</span>
              {isTodayDate && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  오늘
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {entry ? (
            <div className="space-y-3">
              {/* Mood and keywords */}
              <div className="flex items-center gap-2 flex-wrap">
                {mood && (
                  <Badge variant="outline" className="gap-1">
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </Badge>
                )}
                {entry.keywords?.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {entry.wordCount}단어
                </Badge>
              </div>

              {/* Preview */}
              {entry.preview && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {entry.preview}
                  {entry.preview.length >= 100 && "..."}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/history/${entry.chatId}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-1">
                    <ExternalLink className="h-4 w-4" />
                    자세히 보기
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                {isTodayDate
                  ? "아직 오늘의 일기를 작성하지 않았어요"
                  : "이 날은 일기를 작성하지 않았어요"}
              </p>
              {isTodayDate && onWriteToday && (
                <Button
                  onClick={onWriteToday}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                >
                  <PenLine className="h-4 w-4" />
                  오늘 일기 쓰기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
