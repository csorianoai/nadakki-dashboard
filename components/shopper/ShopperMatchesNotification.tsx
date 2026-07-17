"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useShopper } from "@/components/shopper/ShopperProvider";
import { getLastNotifiedAt, setLastNotifiedAt } from "@/lib/shopper/storage";

export function ShopperMatchesNotification() {
  const { profile, newMatchCount } = useShopper();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!profile?.active || newMatchCount <= 0) {
      setVisible(false);
      return;
    }
    const last = getLastNotifiedAt();
    const today = new Date().toDateString();
    if (last !== today) {
      setVisible(true);
    }
  }, [profile, newMatchCount]);

  if (!visible || newMatchCount <= 0) return null;

  const dismiss = () => {
    setLastNotifiedAt(new Date().toDateString());
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-r-sm border border-brand/30 bg-nk-surface p-4 shadow-nk-lg md:left-auto md:right-6"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-nk-fg">
          🤖 Tu AI encontró {newMatchCount} vehículo{newMatchCount > 1 ? "s" : ""} nuevo
          {newMatchCount > 1 ? "s" : ""} para ti
        </p>
        <Link
          href="/autos/mi-shopper"
          onClick={dismiss}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Ver ahora
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-full p-1 text-nk-fg-muted hover:bg-nk-surface-2"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
