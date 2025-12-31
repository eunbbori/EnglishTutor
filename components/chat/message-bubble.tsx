import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CorrectionCard } from "./correction-card";
import type { CorrectionResponse } from "@/lib/ai/schema";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // Assistant message - parse JSON and render CorrectionCard
  try {
    const correction = JSON.parse(message.content) as CorrectionResponse;

    return (
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-[80%]">
          <CorrectionCard correction={correction} />
        </div>
      </div>
    );
  } catch (error) {
    // Fallback for invalid JSON
    return (
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-[80%]">
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">
              응답을 처리하는 중입니다...
            </p>
          </div>
        </div>
      </div>
    );
  }
}
