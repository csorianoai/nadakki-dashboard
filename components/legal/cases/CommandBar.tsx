"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Filter, FolderSearch, Search } from "lucide-react";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export type CommandBarChip = { id: string; active: boolean; label: string; onToggle: () => void };

type Props = {
  query: string;
  onQuery: (next: string) => void;
  chips: CommandBarChip[];
};

export function CommandBar({ query, onQuery, chips }: Props) {
  const m = useLegalCasesMessages();
  const lm = m.list.revolution.command;
  const inputRef = useRef<HTMLInputElement>(null);
  const [shortcut, setShortcut] = useState("Ctrl");

  useEffect(() => {
    try {
      const mac =
        typeof navigator !== "undefined" && /Mac|iPhone|iPod/.test(navigator.platform ?? "");
      setShortcut(mac ? "⌘" : "Ctrl");
    } catch {
      /* entorno restringido sin navigator */
    }
  }, []);

  const focusSearch = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  return (
    <div
      className="flex min-h-[3.75rem] flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/65 px-3 py-2 shadow-xl shadow-black/20 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3"
      aria-label={lm.bar_label}
    >
      <div className="flex min-h-[2.5rem] flex-1 items-center gap-3 rounded-xl border border-zinc-700/85 bg-gradient-to-br from-zinc-950 to-zinc-900 px-4 py-2">
        <Search className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          aria-label={m.list.filters.search}
          placeholder={`${lm.search_placeholder} (${shortcut}+K)`}
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-full min-w-0 border-0 bg-transparent text-sm tracking-tight text-zinc-100 placeholder:text-zinc-500 outline-none ring-0"
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto py-1 pr-1 md:flex-wrap md:overflow-visible">
        <span className="sr-only">{lm.filters_label}</span>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onToggle}
            aria-pressed={chip.active}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
              chip.active ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/55" : "bg-zinc-800/85 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-zinc-800 pt-3 md:border-t-0 md:pt-0">
        <Link
          href="/legal/cases/new"
          className="inline-flex h-[2.5rem] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 px-5 text-[13px] font-semibold text-zinc-950 shadow-lg shadow-black/35 ring-1 ring-emerald-400 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 whitespace-nowrap"
        >
          <FolderSearch className="h-5 w-5 shrink-0" aria-hidden />
          {m.list.create_button}
        </Link>
        <button
          type="button"
          className="hidden h-[2.5rem] shrink-0 items-center gap-2 rounded-xl border border-zinc-700/90 bg-gradient-to-br from-zinc-800/95 to-transparent px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 md:inline-flex"
          onClick={focusSearch}
        >
          <Filter className="h-5 w-5 text-zinc-400" aria-hidden />
          <span className="whitespace-nowrap">{lm.quick_focus_filters}</span>
        </button>
      </div>
    </div>
  );
}
