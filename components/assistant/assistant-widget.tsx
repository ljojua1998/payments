"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistantChat } from "@/lib/hooks/use-assistant-chat";
import { PaymentsLogo } from "@/components/logo";
import { AssistantChat } from "@/components/assistant/assistant-chat";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const chat = useAssistantChat();

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Payments AI ასისტენტი"
          className="fixed inset-x-3 bottom-20 z-50 flex h-[70svh] max-h-[600px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px] lg:bottom-24"
        >
          <div className="flex items-center justify-between border-b border-border bg-brand-deep px-4 py-3">
            <div className="flex items-center gap-2.5">
              <PaymentsLogo size={26} />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Payments AI</p>
                <p className="text-[11px] text-white/60">
                  პასუხები მონაცემების ანალიზის შედეგად
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="დახურვა"
              className="rounded-md p-1 text-white/70 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <AssistantChat
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            onSend={chat.send}
            onStop={chat.stop}
            onClear={chat.clear}
          />
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "ასისტენტის დახურვა" : "Payments AI ასისტენტის გახსნა"}
        className={cn(
          "fixed bottom-20 right-4 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 lg:bottom-6 lg:right-6",
          open && "scale-90 opacity-0 lg:scale-100 lg:opacity-100",
        )}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </>
  );
}
