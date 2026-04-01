"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Bot, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  user?: { name: string | null; image: string | null };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load care circle ID
  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) {
          setCareCircleId(data[0].careCircleId);
        }
      })
      .catch(() => {});
  }, []);

  // Load message history
  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/chat?careCircleId=${careCircleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, [careCircleId]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  async function handleSend(content: string) {
    if (!careCircleId || isLoading) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careCircleId, message: content }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingContent(fullText);
      }

      // Add assistant message to list
      if (fullText) {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      // Show error as assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ASSISTANT",
          content: "Sorry, I had trouble responding. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 pt-6">
        <h2 className="text-2xl font-bold">Care Assistant</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ask me anything about your care
        </p>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Hi! I can help with scheduling, meals, care coordination, and more.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Who's here today?", "What meals are planned?", "Any open requests?"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role === "USER" ? "user" : "assistant"}
            content={msg.content}
            userName={msg.user?.name ?? undefined}
            timestamp={format(new Date(msg.createdAt), "h:mm a")}
          />
        ))}

        {streamingContent && (
          <ChatBubble role="assistant" content={streamingContent} />
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-sage-dark" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border pt-3 pb-2">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
