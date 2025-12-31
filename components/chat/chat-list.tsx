"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { LoadingMessage } from "./loading-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatList({ messages, isLoading = false }: ChatListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-2">AI English Tutor</h2>
          <p className="text-muted-foreground">
            영어 문장을 입력하면 자연스러운 표현으로 교정해드립니다.
            <br />
            한국어로 입력하시면 영어로 번역해드립니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div ref={scrollRef} className="flex flex-col gap-4 py-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Show loading indicator when waiting for AI response */}
        {isLoading && <LoadingMessage />}
      </div>
    </ScrollArea>
  );
}
