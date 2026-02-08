/**
 * XP Feedback Component
 * v3.1.1: Displays XP rewards and daily cap warnings
 */

import { Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface XpFeedbackProps {
  messages: string[];
  cappedByDailyLimit?: boolean;
  className?: string;
}

export function XpFeedback({ messages, cappedByDailyLimit, className }: XpFeedbackProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* XP Reward Messages */}
      <div className="flex flex-col gap-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-100">
          <Sparkles className="h-4 w-4" />
          <span>경험치 획득</span>
        </div>

        <div className="space-y-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              {message.startsWith("⏰") || message.startsWith("💡") ? (
                // Warning/info messages
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              ) : (
                // Regular XP messages
                <span>{message}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Cap Warning (if applicable) */}
      {cappedByDailyLimit && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">일일 XP 상한 도달</p>
            <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">
              오늘은 더 이상 일기 작성 XP를 받을 수 없어요. 내일 다시 도전해보세요!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
