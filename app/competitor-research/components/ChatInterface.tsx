"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessageModel } from "@/hooks/useChatConversation";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import { ChatMessageBubble } from "./ChatMessage";
import { Loader2, Send } from "lucide-react";

export function ChatInterface({
  messages,
  sending,
  onSend,
  countryCode,
  lang,
  onClear,
}: {
  messages: ChatMessageModel[];
  sending: boolean;
  onSend: (text: string) => void;
  countryCode: string;
  lang: UILang;
  onClear: () => void;
}) {
  const t = crStrings(lang);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const submit = () => {
    const v = input.trim();
    if (!v || sending) return;
    onSend(v);
    setInput("");
  };

  return (
    <div className="flex h-[min(70vh,560px)] flex-col rounded-xl border border-slate-700/60 bg-slate-950/40">
      <div className="flex items-center justify-end border-b border-slate-700/50 px-3 py-2">
        <button
          type="button"
          className="text-xs text-cyan-400/90 hover:underline"
          onClick={onClear}
        >
          {t.chatClear}
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            {t.chatPlaceholder}
            <span className="mt-2 block text-xs text-slate-600">{t.chatHintEs}</span>
          </p>
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} msg={m} lang={lang} />)
        )}
        {sending ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="animate-spin" size={14} />
            …
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <div className="border-t border-slate-700/50 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.chatPlaceholder}
            rows={2}
            className="min-h-[48px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
            aria-label="Chat message"
            disabled={sending}
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-600/80 text-white hover:bg-cyan-500 disabled:opacity-40"
            aria-label={t.send}
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-600">country: {countryCode}</p>
      </div>
    </div>
  );
}
