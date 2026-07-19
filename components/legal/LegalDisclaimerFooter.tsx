"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

/** GR-14 footer — persistent (non-dismissable per Legal Core coverage spec). */
export function LegalDisclaimerFooter() {
  const m = useLegalHomeMessages();

  return (
    <footer
      className="border-t border-zinc-800/50 bg-zinc-950/95 px-6 py-3 text-sm leading-relaxed text-zinc-500 md:px-8"
      role="contentinfo"
      aria-label="Aviso legal GR-14"
    >
      <strong className="text-zinc-300">{m.disclaimer_title}</strong> {m.disclaimer_ley_91}
    </footer>
  );
}
