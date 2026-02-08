"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Lock } from "lucide-react";

interface XpStatus {
  xp: number;
  level: number;
  title: string;
  equippedTitle: string | null;
  earnedTitles: string[];
  progress: {
    current: number;
    required: number;
    percentage: number;
    nextLevelXp: number;
  };
  booster: {
    active: boolean;
    expiresAt: string | null;
  };
  // v3.1.1: Potential level
  isPremium: boolean;
  potentialLevel: {
    level: number;
    title: string;
    gap: number;
  } | null;
}

export function LevelBadge() {
  const [xpStatus, setXpStatus] = useState<XpStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXpStatus();
  }, []);

  const fetchXpStatus = async () => {
    try {
      const response = await fetch("/api/user/xp");
      const data = await response.json();

      if (data.success) {
        setXpStatus(data.data);
      }
    } catch (error) {
      console.error("[Level Badge] Failed to fetch XP status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !xpStatus) {
    return null;
  }

  const displayTitle = xpStatus.equippedTitle || xpStatus.title;
  const showPotentialLevel = xpStatus.potentialLevel !== null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* Level Badge */}
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold"
        >
          <Sparkles className="h-3 w-3" />
          <span>Lv.{xpStatus.level}</span>
        </Badge>

      {/* Title & Progress */}
      <div className="hidden sm:flex flex-col gap-0.5 min-w-[120px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground truncate">
            {displayTitle}
          </span>
          {xpStatus.booster.active && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              2x
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {xpStatus.progress.required > 0 && (
          <div className="flex items-center gap-1.5">
            <Progress
              value={xpStatus.progress.percentage}
              className="h-1.5 w-full"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {xpStatus.progress.current}/{xpStatus.progress.required}
            </span>
          </div>
        )}

        {/* Max Level Reached */}
        {xpStatus.progress.required === 0 && (
          <span className="text-[10px] text-primary font-semibold">
            MAX LEVEL
          </span>
        )}
      </div>
      </div>

      {/* Potential Level Display (v3.1.1) */}
      {showPotentialLevel && xpStatus.potentialLevel && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded border border-purple-200 dark:border-purple-800">
          <Lock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          <span className="text-xs text-purple-700 dark:text-purple-300">
            프리미엄: Lv.{xpStatus.potentialLevel.level} ({xpStatus.potentialLevel.title})
          </span>
        </div>
      )}
    </div>
  );
}
