"use client";

import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import Link from "next/link";

interface UsageCounterProps {
  remaining: number;
  isPremium: boolean;
}

export function UsageCounter({ remaining, isPremium }: UsageCounterProps) {
  if (isPremium) {
    return (
      <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        Premium
      </Badge>
    );
  }

  const isLow = remaining <= 1;

  return (
    <Link href="/pricing">
      <Badge
        variant={isLow ? "destructive" : "secondary"}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        오늘 {remaining}회 남음
      </Badge>
    </Link>
  );
}
