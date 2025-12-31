"use client";

import { useState } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { LevelSelector } from "@/components/profile/level-selector";
import { Toaster } from "@/components/ui/toaster";
import { Settings, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSend = async (userMessage: string) => {
    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Get chat ID from headers
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !chatId) {
        setChatId(newChatId);
      }

      // Parse JSON response
      const data = await response.json();
      const correctionData = data.object;

      console.log("[Client] Received data:", data);
      console.log("[Client] Correction data:", correctionData);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: JSON.stringify(correctionData),
      };

      console.log("[Client] Assistant message:", assistantMsg);

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: JSON.stringify({
          originalText: userMessage,
          correctedText: "Network error",
          koreanExplanation: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
          alternatives: [],
        }),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col relative">
      {/* Clean Header */}
      <header className="border-b bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">AI English Tutor</h1>
          <p className="text-sm text-muted-foreground">
            자연스러운 영어 표현으로 교정해드립니다
          </p>
        </div>
      </header>

      <ChatList messages={messages} />
      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {/* Floating Settings Button */}
      <div className="fixed top-20 right-4 md:top-20 md:right-4 z-50">
        {!showSettings ? (
          <button
            onClick={() => setShowSettings(true)}
            className="bg-primary text-primary-foreground p-3 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            aria-label="설정 열기"
          >
            <Settings className="w-5 h-5" />
          </button>
        ) : (
          <div className="bg-card border rounded-lg shadow-xl p-4 w-80 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                설정
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="hover:bg-accent rounded p-1 transition-colors"
                aria-label="설정 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <LevelSelector compact />
          </div>
        )}
      </div>

      <Toaster />
    </main>
  );
}
