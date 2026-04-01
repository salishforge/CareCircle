"use client";

import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  userName?: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, userName, timestamp }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary/10 text-primary" : "bg-sage/20 text-sage-dark"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          }`}
        >
          {content}
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {userName && !isUser ? `${userName} · ` : ""}{timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
