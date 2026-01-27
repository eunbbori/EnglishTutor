"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Target } from "lucide-react";

export type DiaryMode = "free" | "challenge";

interface ModeSelectorProps {
  mode: DiaryMode;
  onModeChange: (mode: DiaryMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Free Mode Button - HIG touch target */}
      <button
        onClick={() => onModeChange("free")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-3 sm:py-3 rounded-lg sm:rounded-xl transition-smooth border-2",
          "text-xs sm:text-sm font-medium touch-manipulation min-h-[44px]",
          mode === "free"
            ? "bg-white border-ds-border-default text-ds-text-primary shadow-card"
            : "bg-ds-bg-secondary/30 border-ds-border-light text-ds-text-secondary hover:bg-ds-bg-secondary/50 active:bg-ds-bg-secondary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">쓰기 모드</span>
      </button>

      {/* Challenge Mode Button - HIG touch target */}
      <button
        onClick={() => onModeChange("challenge")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-3 sm:py-3 rounded-lg sm:rounded-xl transition-smooth border-2",
          "text-xs sm:text-sm font-medium touch-manipulation min-h-[44px]",
          mode === "challenge"
            ? "bg-ds-bg-secondary border-ds-border-default text-ds-text-primary shadow-card"
            : "bg-ds-bg-secondary/30 border-ds-border-light text-ds-text-secondary hover:bg-ds-bg-secondary/50 active:bg-ds-bg-secondary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Target className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">챌린지 모드</span>
      </button>
    </div>
  );
}
