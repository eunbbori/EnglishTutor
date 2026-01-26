import React from "react";

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights vocabulary words/phrases in text
 * @param text - The text to highlight
 * @param vocabularyWords - Array of words/phrases to highlight
 * @returns React nodes with highlighted words
 */
export function highlightVocabularyInText(
  text: string,
  vocabularyWords: string[]
): React.ReactNode {
  // If no vocabulary words or text, return original
  if (!vocabularyWords || vocabularyWords.length === 0 || !text) {
    return text;
  }

  try {
    // Sort words by length (descending) to match longer phrases first
    const sortedWords = [...vocabularyWords]
      .filter((word) => word && word.trim().length > 0)
      .sort((a, b) => b.length - a.length);

    if (sortedWords.length === 0) {
      return text;
    }

    // Escape special regex characters and create pattern
    const escapedWords = sortedWords.map((word) => escapeRegex(word.trim()));

    // Create regex pattern for matching vocabulary words
    const pattern = new RegExp(
      `(${escapedWords.join("|")})`,
      "gi"
    );

    // Split text by pattern and track matches
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchCount = 0;

    // Reset regex state
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      // Prevent infinite loop
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
        continue;
      }

      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add highlighted match
      parts.push(
        <mark
          key={`highlight-${matchCount}-${match.index}`}
          className="bg-yellow-200/60 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-100 rounded px-0.5 cursor-pointer hover:bg-yellow-300/70 transition-colors"
        >
          {match[0]}
        </mark>
      );

      lastIndex = pattern.lastIndex;
      matchCount++;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  } catch (error) {
    console.error("Error highlighting text:", error);
    return text;
  }
}

/**
 * Recursively processes React children and applies highlighting to text nodes
 * @param children - React children nodes
 * @param vocabularyWords - Array of words/phrases to highlight
 * @returns React nodes with highlighted text
 */
export function highlightChildrenRecursively(
  children: React.ReactNode,
  vocabularyWords: string[]
): React.ReactNode {
  // If no vocabulary words, return original
  if (!vocabularyWords || vocabularyWords.length === 0) {
    return children;
  }

  // Handle string children
  if (typeof children === "string") {
    return highlightVocabularyInText(children, vocabularyWords);
  }

  // Handle array of children
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as { children?: React.ReactNode };
        return React.cloneElement(
          child as React.ReactElement<{ children?: React.ReactNode }>,
          { key: child.key || index } as Partial<{ children?: React.ReactNode }>,
          highlightChildrenRecursively(childProps.children, vocabularyWords)
        );
      } else if (typeof child === "string") {
        return highlightVocabularyInText(child, vocabularyWords);
      }
      return child;
    });
  }

  // Handle React element
  if (React.isValidElement(children)) {
    const childProps = children.props as { children?: React.ReactNode };
    return React.cloneElement(
      children as React.ReactElement<{ children?: React.ReactNode }>,
      {} as Partial<{ children?: React.ReactNode }>,
      highlightChildrenRecursively(childProps.children, vocabularyWords)
    );
  }

  return children;
}
