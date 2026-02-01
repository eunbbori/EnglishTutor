"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, X } from "lucide-react";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  newTitle: string;
}

export function LevelUpModal({ isOpen, onClose, oldLevel, newLevel, newTitle }: LevelUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after a short delay
      const timer = setTimeout(() => setShowAnimation(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className={`relative z-10 w-full max-w-md transform transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full w-20 h-20 flex items-center justify-center animate-bounce">
            <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold">레벨 업!</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            축하합니다! 새로운 레벨에 도달했어요
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Level Progress */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Lv.{oldLevel}
              </Badge>
            </div>

            <div className="flex-shrink-0">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>

            <div className="text-center">
              <Badge
                variant="default"
                className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500"
              >
                Lv.{newLevel}
              </Badge>
            </div>
          </div>

          {/* New Title */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">새로운 칭호</p>
            <p className="text-xl font-bold text-primary">{newTitle}</p>
          </div>

          {/* Encouragement Message */}
          <div className="text-center text-sm text-muted-foreground">
            <p>매일 꾸준히 영어 일기를 쓰며</p>
            <p>실력이 늘고 있어요! 계속 화이팅! 🎉</p>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" size="lg">
            확인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
