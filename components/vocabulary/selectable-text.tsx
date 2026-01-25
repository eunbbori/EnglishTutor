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

/**
 * Extract context around selected text (up to 500 chars)
 */
function extractContext(selectedText: string): string {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode) return "";

  try {
    // Get the parent element containing the text
    const parentElement = selection.anchorNode.parentElement;
    if (!parentElement) return "";

    // Get full text content
    let fullText = parentElement.textContent || "";

    // Find the position of selected text
    const selectedIndex = fullText.indexOf(selectedText);
    if (selectedIndex === -1) return "";

    // Define sentence boundaries
    const sentenceBoundaries = /[.!?]\s+/g;

    // Find sentence start (look backwards)
    let sentenceStart = 0;
    const textBeforeSelection = fullText.substring(0, selectedIndex);
    const matches = Array.from(textBeforeSelection.matchAll(sentenceBoundaries));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      sentenceStart = lastMatch.index! + lastMatch[0].length;
    }

    // Find sentence end (look forwards)
    let sentenceEnd = fullText.length;
    const textAfterSelection = fullText.substring(selectedIndex + selectedText.length);
    const nextBoundary = textAfterSelection.search(sentenceBoundaries);
    if (nextBoundary !== -1) {
      sentenceEnd = selectedIndex + selectedText.length + nextBoundary + 1;
    }

    // Extract context
    let context = fullText.substring(sentenceStart, sentenceEnd).trim();

    // Limit to 500 chars
    if (context.length > 500) {
      // Try to keep the selected text in the middle
      const halfLimit = 250;
      const selectedPosInContext = selectedIndex - sentenceStart;

      if (selectedPosInContext > halfLimit) {
        const start = selectedPosInContext - halfLimit;
        context = "..." + context.substring(start, start + 500).trim();
      } else {
        context = context.substring(0, 500).trim() + "...";
      }
    }

    return context;
  } catch (error) {
    console.error("Error extracting context:", error);
    return "";
  }
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
  const [isSaving, setIsSaving] = useState(false);
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
    if (isSaving) return;

    try {
      setIsSaving(true);

      // Extract context from the selected text
      const context = extractContext(word);

      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          sourceType,
          sourceId,
          context, // Include context for AI enrichment
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save word");
      }

      const data = await response.json();

      // Show different message if enrichment failed
      if (data.enrichmentFailed) {
        toast({
          title: "표현 노트에 저장되었습니다",
          description: `"${word}"를 저장했습니다. (일부 정보는 자동 생성되지 않았습니다)`,
        });
      } else {
        toast({
          title: "표현 노트에 저장되었습니다",
          description: `"${word}"의 발음, 의미, 예문이 자동으로 생성되었습니다.`,
        });
      }

      // Clear selection and tooltip
      window.getSelection()?.removeAllRanges();
      setTooltip(null);
    } catch (error) {
      console.error("Failed to save word:", error);
      toast({
        title: "저장 실패",
        description: "표현을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
