/**
 * Calendar utility functions
 * - Date handling for KST timezone
 * - Heatmap level calculation
 */

/**
 * KST timezone offset in milliseconds (UTC+9)
 */
const KST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * Get month metadata: number of days and starting day of week
 */
export function getMonthDays(year: number, month: number): {
  daysInMonth: number;
  startDayOfWeek: number; // 0 = Sunday, 6 = Saturday
  weeks: number;
} {
  // month is 1-indexed (1 = January)
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const weeks = Math.ceil((daysInMonth + startDayOfWeek) / 7);

  return { daysInMonth, startDayOfWeek, weeks };
}

/**
 * Format date to KST-based YYYY-MM-DD string
 */
export function formatDateKST(date: Date): string {
  const kstDate = new Date(date.getTime() + KST_OFFSET);
  return kstDate.toISOString().split("T")[0];
}

/**
 * Get today's date in KST as YYYY-MM-DD string
 */
export function getTodayKST(): string {
  return formatDateKST(new Date());
}

/**
 * Parse KST date string to Date object (at midnight KST)
 */
export function parseDateKST(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get current year and month in KST
 */
export function getCurrentYearMonthKST(): { year: number; month: number } {
  const now = new Date();
  const kstDate = new Date(now.getTime() + KST_OFFSET);
  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1, // 1-indexed
  };
}

/**
 * Calculate heatmap level based on word count
 * Level 0: No entry
 * Level 1: 1-30 words
 * Level 2: 31-60 words
 * Level 3: 61-100 words
 * Level 4: 100+ words
 */
export function getHeatmapLevel(wordCount: number): 0 | 1 | 2 | 3 | 4 {
  if (wordCount <= 0) return 0;
  if (wordCount <= 30) return 1;
  if (wordCount <= 60) return 2;
  if (wordCount <= 100) return 3;
  return 4;
}

/**
 * Get heatmap color class based on level
 */
export function getHeatmapColorClass(level: 0 | 1 | 2 | 3 | 4): string {
  const colors: Record<number, string> = {
    0: "bg-transparent",
    1: "bg-amber-100 dark:bg-amber-900/30",
    2: "bg-amber-200 dark:bg-amber-800/40",
    3: "bg-amber-300 dark:bg-amber-700/50",
    4: "bg-amber-500 dark:bg-amber-600/60",
  };
  return colors[level];
}

/**
 * Calculate word count from text
 */
export function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Get date range for a month (start and end dates in KST)
 */
export function getMonthDateRange(year: number, month: number): {
  startDate: Date;
  endDate: Date;
} {
  // Start: first day of month at 00:00:00 KST
  const startDate = new Date(year, month - 1, 1, 0, 0, 0);
  // End: last day of month at 23:59:59 KST
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return { startDate, endDate };
}

/**
 * Check if a date string is today in KST
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayKST();
}

/**
 * Get previous month
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Get next month
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Format month name in Korean
 */
export function getMonthNameKorean(month: number): string {
  return `${month}월`;
}

/**
 * Format month name in English
 */
export function getMonthNameEnglish(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1];
}
