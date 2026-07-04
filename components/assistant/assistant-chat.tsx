"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/schemas/assistant";
import { Button } from "@/components/ui/button";
import { PaymentsLogo } from "@/components/logo";

const STARTER_QUESTIONS = [
  "ვის აქვს დავალიანება ივნისში?",
  "ვინ რამდენი გადაიხადა ივნისში?",
  "როგორ დავამატო ახალი კომპანია?",
];

type AssistantChatProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onClear: () => void;
};

export function AssistantChat({
  messages,
  isStreaming,
  onSend,
  onStop,
  onClear,
}: AssistantChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <PaymentsLogo size={40} />
            <div>
              <p className="font-medium">Payments AI ასისტენტი</p>
              <p className="mt-1 text-sm text-muted-foreground">
                მკითხეთ გადახდებზე, დავალიანებებზე ან როგორ გამოიყენოთ საიტი
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => onSend(question)}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted",
                )}
              >
                {message.content ||
                  (isStreaming && index === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </span>
                  ) : (
                    "…"
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-3"
      >
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground"
            aria-label="საუბრის გასუფთავება"
            onClick={onClear}
          >
            <RotateCcw size={15} />
          </Button>
        )}
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="დაწერეთ კითხვა..."
          aria-label="კითხვა ასისტენტისთვის"
          className="h-10 w-full rounded-full border border-input bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring sm:text-sm"
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 shrink-0 rounded-full"
            aria-label="შეჩერება"
            onClick={onStop}
          >
            <Square size={14} />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            aria-label="გაგზავნა"
            disabled={!input.trim()}
          >
            <Send size={15} />
          </Button>
        )}
      </form>
    </div>
  );
}
