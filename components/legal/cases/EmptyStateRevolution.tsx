"use client";

import Link from "next/link";
import { Layers, PlusCircle } from "lucide-react";
import type { LegalCasesMessages } from "@/hooks/useLegalCasesMessages";

type EmptyCopy = LegalCasesMessages["list"]["revolution"]["empty"];

type Props = {
  headline: string;
  body: string;
  messages: EmptyCopy;
  createHref?: string;
};

export function EmptyStateRevolution({ headline, body, messages, createHref = "/legal/cases/new" }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/70 bg-gradient-to-b from-zinc-900/40 to-zinc-950/55 px-6 py-16 text-center backdrop-blur-md backdrop-saturate-150"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent ring-1 ring-cyan-500/30">
        <Layers className="h-8 w-8 text-cyan-300/90" aria-hidden />
      </div>
      <h2 className="mt-8 text-xl font-semibold tracking-tight text-zinc-100">{headline}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{body}</p>
      <Link
        href={createHref}
        className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/90 via-cyan-500/95 to-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-inner ring-1 ring-emerald-500/70 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
      >
        <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
        <span>{messages.cta}</span>
      </Link>
      <span className="mt-10 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{messages.footnote}</span>
    </div>
  );
}
