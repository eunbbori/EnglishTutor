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
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
      {/* Free Mode Button */}
      <button
        onClick={() => onModeChange("free")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all",
          "text-sm font-medium",
          mode === "free"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span>자유 모드</span>
      </button>

      {/* Challenge Mode Button */}
      <button
        onClick={() => onModeChange("challenge")}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all",
          "text-sm font-medium",
          mode === "challenge"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Target className="h-4 w-4" />
        <span>챌린지 모드</span>
      </button>
    </div>
  );
}
