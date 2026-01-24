"use client";

import { useState, useRef, ReactNode } from "react";
import { WordTooltip } from "./word-tooltip";
import { useToast } from "@/hooks/use-toast";

interface SelectableTextProps {
  children: ReactNode;
  className?: string;
  sourceType?: "diary" | "chat";
  sourceId?: string;
}

export function SelectableText({
  children,
  className,
  sourceType = "diary",
  sourceId,
}: SelectableTextProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    position: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText || selectedText.length === 0) {
      setTooltip(null);
      return;
    }

    // Get selection position
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      setTooltip({
        text: selectedText,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
        },
      });
    }
  };

  const handleSaveWord = async (word: string) => {
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          sourceType,
          sourceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save word");
      }

      toast({
        title: "단어장에 저장되었습니다",
        description: `"${word}"를 저장했습니다.`,
      });

      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error("Failed to save word:", error);
      toast({
        title: "저장 실패",
        description: "단어를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onMouseUp={handleMouseUp}
        style={{ userSelect: "text", cursor: "text" }}
      >
        {children}
      </div>

      {tooltip && (
        <WordTooltip
          selectedText={tooltip.text}
          position={tooltip.position}
          onSave={handleSaveWord}
          onClose={() => setTooltip(null)}
        />
      )}
    </>
  );
}
