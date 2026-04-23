"use client";

import { useCallback, useRef, useState } from "react";
import { spyfu } from "@/lib/api/spyfu-client";
import type { ChatResponse, IntelligenceConfidence } from "@/types/spyfu";
import { BudgetExceededError, UnknownIntentError } from "@/types/spyfu";

export type ChatRole = "user" | "assistant";

export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: string;
  /** Assistant-only */
  tool?: string;
  language?: string;
  confidence?: IntelligenceConfidence;
  meta?: ChatResponse["meta"];
  unknownExamples?: { es?: string[]; en?: string[] };
  isError?: boolean;
  errorKind?: "budget" | "generic";
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatConversation() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const inFlight = useRef(false);

  const send = useCallback(
    async (text: string, countryCode: string, tenantId: string | null) => {
      const trimmed = text.trim();
      if (!trimmed || inFlight.current) return;
      inFlight.current = true;
      setSending(true);
      const userMsg: ChatMessageModel = { id: uid(), role: "user", content: trimmed };
      setMessages((m) => [...m, userMsg]);
      try {
        const res = await spyfu.chat(trimmed, {
          language: "auto",
          countryCode,
          conversationId,
          tenantId,
        });
        if (res.conversation_id) setConversationId(res.conversation_id);
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: res.reply_markdown || res.summary || "",
            tool: res.tool,
            language: res.language,
            confidence: res.confidence,
            meta: res.meta,
          },
        ]);
      } catch (e) {
        if (e instanceof BudgetExceededError) {
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              content: e.message,
              isError: true,
              errorKind: "budget",
            },
          ]);
        } else {
          const examples = e instanceof UnknownIntentError ? e.examples : undefined;
          const err = e instanceof Error ? e : new Error(String(e));
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              content: err.message || String(e),
              isError: true,
              errorKind: "generic",
              unknownExamples: examples,
            },
          ]);
        }
      } finally {
        inFlight.current = false;
        setSending(false);
      }
    },
    [conversationId]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return { messages, sending, send, clear, conversationId };
}
