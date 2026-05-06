"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

export function LegalDisclaimerFooter() {
  const m = useLegalHomeMessages();
  return (
    <footer
      className="sticky bottom-0 z-10 border-t border-forgeInk-300 bg-forgeSurface-card px-6 py-3 text-forge-sm leading-relaxed text-forge-text-muted md:px-8"
      role="contentinfo"
      aria-label="Aviso legal Ley 91"
    >
      <strong className="text-forge-text">{m.disclaimer_title}</strong> {m.disclaimer_ley_91}
    </footer>
  );
}
