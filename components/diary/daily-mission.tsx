"use client";

import { Target, Sparkles, Check } from "lucide-react";
import type { WordOfTheDay } from "@/lib/missions";

interface DailyMissionProps {
  word: WordOfTheDay;
  isCompleted?: boolean;
}

export function DailyMission({ word, isCompleted = false }: DailyMissionProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/50 dark:border-purple-800/50 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
              오늘의 도전 단어
            </span>
            {isCompleted && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  사용 완료
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {word.word}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {word.meaning}
              </p>
            </div>
            <div className="pl-3 border-l-2 border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400 italic">
                "{word.example}"
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
        <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          이 단어를 사용해서 일기를 작성해보세요!
        </p>
      </div>
    </div>
  );
}
