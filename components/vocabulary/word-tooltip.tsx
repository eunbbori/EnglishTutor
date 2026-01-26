"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Loader2 } from "lucide-react";

interface WordTooltipProps {
  selectedText: string;
  position: { x: number; y: number };
  onSave: (word: string) => Promise<void>;
  onClose: () => void;
}

export function WordTooltip({
  selectedText,
  position,
  onSave,
  onClose,
}: WordTooltipProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedText);
      onClose();
    } catch (error) {
      console.error("Failed to save word:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="absolute z-50 bg-background border rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateY(-100%) translateY(-8px)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground px-2">
          "{selectedText}"
        </span>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="gap-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <BookmarkPlus className="h-3 w-3" />
              표현노트에 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
