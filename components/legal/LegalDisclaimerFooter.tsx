"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

export function LegalDisclaimerFooter() {
  const m = useLegalHomeMessages();
  return (
    <footer
      className="sticky bottom-0 z-10 border-t border-zinc-800/50 bg-zinc-950/80 px-6 py-3 text-sm leading-relaxed text-zinc-500 backdrop-blur-md md:px-8"
      role="contentinfo"
      aria-label="Aviso legal Ley 91"
    >
      <strong className="text-zinc-300">{m.disclaimer_title}</strong> {m.disclaimer_ley_91}
    </footer>
  );
}
