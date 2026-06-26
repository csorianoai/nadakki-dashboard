"use client";

import { useState, useEffect } from "react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

const STORAGE_KEY = "legal_disclaimer_dismissed";

export function LegalDisclaimerFooter() {
  const m = useLegalHomeMessages();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage unavailable (SSR / iframe sandbox)
    }
  }, []);

  if (dismissed) return null;

  return (
    <footer
      className="relative border-t border-zinc-800/50 bg-zinc-950/95 px-6 py-3 text-sm leading-relaxed text-zinc-500 md:px-8 flex items-start justify-between gap-3"
      role="contentinfo"
      aria-label="Aviso legal Ley 91"
    >
      <div>
        <strong className="text-zinc-300">{m.disclaimer_title}</strong> {m.disclaimer_ley_91}
      </div>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // sessionStorage unavailable
          }
          setDismissed(true);
        }}
        className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Cerrar aviso legal"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </footer>
  );
}
