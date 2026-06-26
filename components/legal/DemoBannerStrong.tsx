"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { useKnowledgePackInfo } from "@/hooks/useLegal";

const DISMISS_KEY = "nadakki_legal_demo_banner_dismissed";

export function DemoBannerStrong() {
  const { info, loading } = useKnowledgePackInfo("do");
  const verified = info?.verification_status === "verified";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch { /* SSR / private mode */ }
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      if (next) localStorage.setItem(DISMISS_KEY, "1");
      else localStorage.removeItem(DISMISS_KEY);
    } catch { /* ignore */ }
  };

  if (loading) {
    return null;
  }

  if (verified) {
    return (
      <div className="border-b border-green-200/80 bg-green-50 px-3 py-1.5 text-sm text-green-900 max-w-6xl mx-auto">
        <button type="button" onClick={toggle} className="flex w-full items-center gap-2 text-left">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
          <span className="flex-1 leading-snug">
            <span className="font-medium">Piloto controlado</span>
            {!collapsed && (
              <span className="font-normal">
                {" — "}Conocimiento legal validado por abogado RD. Las respuestas asisten pero no sustituyen asesoría legal profesional.
              </span>
            )}
          </span>
          {collapsed
            ? <ChevronDown className="h-4 w-4 shrink-0 text-green-600" />
            : <ChevronUp className="h-4 w-4 shrink-0 text-green-600" />}
        </button>
      </div>
    );
  }

  return null;
}
