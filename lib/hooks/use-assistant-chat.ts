"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/schemas/assistant";

const HISTORY_LIMIT = 8;

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const appendToLast = useCallback((chunk: string) => {
    setMessages((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: last.content + chunk };
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || isStreaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const history: ChatMessage[] = [
        ...messages,
        { role: "user", content: question },
      ];
      setMessages([...history, { role: "assistant", content: "" }]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT) }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          appendToLast(body?.error ?? "პასუხი ვერ მივიღე — სცადეთ თავიდან");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          appendToLast(decoder.decode(value, { stream: true }));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          appendToLast("კავშირი გაწყდა — სცადეთ თავიდან");
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, appendToLast],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, send, stop, clear };
}
