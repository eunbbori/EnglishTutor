"use client";

import { useEffect, useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "onboarding_expression_note_seen";

export function OnboardingTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);

    if (!hasSeenOnboarding) {
      // Show tooltip after a brief delay for better UX
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 500);

      // Auto-hide after 5 seconds
      const hideTimer = setTimeout(() => {
        handleClose();
      }, 5500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-4 animate-in fade-in-0 slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground">
            <strong>Tip:</strong> 교정된 문장에서 텍스트를 드래그하면 표현 노트에 저장할 수 있어요!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            발음, 의미, 예문이 자동으로 생성됩니다.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
