"use client";

import { ConfidenceBadge } from "./ConfidenceBadge";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { ChatMessageModel } from "@/hooks/useChatConversation";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import clsx from "clsx";

export function ChatMessageBubble({ msg, lang }: { msg: ChatMessageModel; lang: UILang }) {
  const t = crStrings(lang);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md bg-cyan-600/25 px-4 py-2 text-sm text-slate-100"
          role="article"
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={clsx(
          "max-w-[90%] rounded-2xl rounded-bl-md border px-4 py-3 text-sm",
          msg.isError
            ? "border-red-500/30 bg-red-950/30 text-red-100"
            : "border-slate-700/60 bg-slate-900/70 text-slate-100"
        )}
        role="article"
      >
        {msg.isError && msg.errorKind === "budget" ? (
          <p>{t.budgetExceeded}</p>
        ) : msg.isError ? (
          <>
            <p className="mb-2">{msg.content}</p>
            {msg.unknownExamples ? (
              <div className="mt-2 border-t border-slate-700/50 pt-2">
                <p className="mb-1 text-xs font-semibold text-amber-200">{t.tryExamples}</p>
                <ul className="list-inside list-disc text-xs text-slate-300">
                  {[...(msg.unknownExamples.es ?? []), ...(msg.unknownExamples.en ?? [])].map(
                    (ex, i) => (
                      <li key={i}>{ex}</li>
                    )
                  )}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <MarkdownRenderer content={msg.content} />
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-700/40 pt-2 text-[10px] text-slate-500">
              {msg.tool ? (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                  {t.toolBadge(msg.tool, msg.language || "—")}
                </span>
              ) : null}
              {msg.confidence?.overall ? (
                <ConfidenceBadge level={msg.confidence.overall} />
              ) : null}
              {msg.meta ? (
                <span>
                  {t.costFooter(
                    String(msg.meta.cost_estimate ?? "—"),
                    msg.meta.cache_hit ? "HIT" : "MISS",
                    String(msg.meta.fetched_at ?? "—")
                  )}
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
