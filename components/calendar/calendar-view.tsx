"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDay, EmptyDayCell } from "./calendar-day";
import { CalendarQuickView } from "./calendar-quick-view";
import {
  getCurrentYearMonthKST,
  getMonthDays,
  getMonthNameEnglish,
  getPreviousMonth,
  getNextMonth,
  getTodayKST,
} from "@/lib/calendar/utils";
import type { CalendarMonthData, CalendarEntryData } from "@/app/api/calendar/[year]/[month]/route";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarViewProps {
  onWriteToday: () => void;
}

export function CalendarView({ onWriteToday }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(getCurrentYearMonthKST);
  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryData | null>(null);

  const { year, month } = currentDate;
  const { daysInMonth, startDayOfWeek } = getMonthDays(year, month);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/${year}/${month}`);
      if (response.ok) {
        const data: CalendarMonthData = await response.json();
        setCalendarData(data);
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Navigation handlers
  const handlePreviousMonth = () => {
    const prev = getPreviousMonth(year, month);
    setCurrentDate(prev);
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(year, month);
    setCurrentDate(next);
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  // Day click handler
  const handleDayClick = (date: string, entry?: CalendarEntryData) => {
    if (selectedDate === date) {
      // Toggle off if clicking same date
      setSelectedDate(null);
      setSelectedEntry(null);
    } else {
      setSelectedDate(date);
      setSelectedEntry(entry || null);
    }
  };

  // Close quick view
  const handleCloseQuickView = () => {
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  // Check if we can navigate to next month (can't go beyond current month)
  const today = getCurrentYearMonthKST();
  const canGoNext = year < today.year || (year === today.year && month < today.month);

  // Generate calendar grid
  const calendarGrid = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarGrid.push(<EmptyDayCell key={`empty-start-${i}`} />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = calendarData?.entries[dateStr];

    calendarGrid.push(
      <CalendarDay
        key={dateStr}
        date={dateStr}
        day={day}
        entry={entry}
        onClick={handleDayClick}
        isCurrentMonth={true}
      />
    );
  }

  // Fill remaining cells to complete the grid
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    calendarGrid.push(<EmptyDayCell key={`empty-end-${i}`} />);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="이전 달"
            className="hover:bg-ds-bg-secondary text-ds-text-primary h-10 w-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h2 className="font-handwriting text-3xl font-bold min-w-[180px] text-center text-ds-text-primary">
            {getMonthNameEnglish(month)} {year}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            aria-label="다음 달"
            className="hover:bg-ds-bg-secondary text-ds-text-primary disabled:opacity-40 h-10 w-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <Button
          onClick={onWriteToday}
          size="default"
          className="bg-ds-accent-primary hover:bg-ds-accent-hover text-white shadow-card rounded-full gap-2 px-6 py-5 text-base font-semibold"
        >
          <PenLine className="h-5 w-5" />
          오늘 쓰기
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-ds-text-primary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 35 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square w-full rounded-full bg-ds-bg-secondary/40 animate-pulse border-[3px] border-ds-border-light"
            />
          ))
        ) : (
          calendarGrid
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-3 mt-6 text-sm text-ds-text-secondary font-medium">
        <span>적음</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-full bg-ds-pastel-yellow/40 border-2 border-ds-pastel-yellow" />
          <div className="w-4 h-4 rounded-full bg-ds-pastel-mint/50 border-2 border-ds-pastel-mint" />
          <div className="w-4 h-4 rounded-full bg-ds-pastel-coral/50 border-2 border-ds-pastel-coral" />
          <div className="w-4 h-4 rounded-full bg-ds-pastel-lavender/60 border-2 border-ds-pastel-lavender" />
        </div>
        <span>많음</span>
      </div>

      {/* Quick View */}
      {selectedDate && (
        <CalendarQuickView
          date={selectedDate}
          entry={selectedEntry}
          onClose={handleCloseQuickView}
          onWriteToday={selectedDate === getTodayKST() && !selectedEntry ? onWriteToday : undefined}
        />
      )}
    </div>
  );
}
