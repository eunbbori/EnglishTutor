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
    <div className="flex items-center gap-3">
      {/* Free Mode Button */}
      <button
        onClick={() => onModeChange("free")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-smooth border-2",
          "text-sm font-medium",
          mode === "free"
            ? "bg-white border-ds-border-default text-ds-text-primary shadow-card"
            : "bg-ds-bg-secondary/30 border-ds-border-light text-ds-text-secondary hover:bg-ds-bg-secondary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span>쓰기 모드</span>
      </button>

      {/* Challenge Mode Button */}
      <button
        onClick={() => onModeChange("challenge")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-smooth border-2",
          "text-sm font-medium",
          mode === "challenge"
            ? "bg-ds-bg-secondary border-ds-border-default text-ds-text-primary shadow-card"
            : "bg-ds-bg-secondary/30 border-ds-border-light text-ds-text-secondary hover:bg-ds-bg-secondary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Target className="h-4 w-4" />
        <span>챌린지 모드</span>
      </button>
    </div>
  );
}
