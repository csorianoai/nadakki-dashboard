"use client";

import { useState, useRef } from "react";
import {
  detectIntent,
  getSuggestions,
} from "@/lib/legal-cockpit/intent-router";

const QUICK = [
  { key: "new_case", label: "Nuevo expediente", href: "/legal/cases/new" },
  { key: "contract", label: "Analizar contrato", query: "contrato" },
  { key: "prescription", label: "Prescripción", query: "prescripción" },
  { key: "aml", label: "AML / KYC", query: "aml kyc" },
  { key: "strategy", label: "Estrategia litigiosa", query: "estrategia litigio" },
  { key: "urgent", label: "Ver urgentes", href: "#urgentes" },
] as const;

interface Props {
  onNavigate: (href: string) => void;
  onFallback: (query: string) => void;
}

export function LegalCommandCenter({ onNavigate, onFallback }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(val: string) {
    setQuery(val);
    setSuggestions(getSuggestions(val));
    setOpen(val.length > 1);
  }

  function submit(q: string) {
    if (!q.trim()) return;
    const intent = detectIntent(q);
    if (intent.found) {
      onNavigate(intent.href);
    } else {
      onFallback(q);
    }
    setQuery("");
    setOpen(false);
  }

  function handleQuick(item: (typeof QUICK)[number]) {
    if ("href" in item && item.href) {
      onNavigate(item.href);
    } else if ("query" in item && item.query) {
      submit(item.query);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-3">
        ¿Qué necesita resolver hoy?
      </p>
      <div className="relative">
        <div className="flex items-center gap-2 border border-zinc-700 rounded-xl px-3 py-2.5
                        focus-within:border-violet-700 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-zinc-500 flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(query)}
            onFocus={() => query.length > 1 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="calcular prescripción, analizar contrato, AML/KYC..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          {query && (
            <button
              onClick={() => submit(query)}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex-shrink-0"
            >
              buscar
            </button>
          )}
        </div>
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-zinc-900
                          border border-zinc-700 rounded-xl overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => {
                  setQuery(s);
                  submit(s);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300
                           hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800
                           last:border-0 transition-colors"
              >
                <span className="text-violet-600 text-xs">&rarr;</span>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {QUICK.map((item) => (
          <button
            key={item.key}
            onClick={() => handleQuick(item)}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-zinc-700/50
                       text-zinc-400 bg-zinc-800/40 hover:border-violet-700/50
                       hover:text-violet-300 hover:bg-violet-950/30 transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
