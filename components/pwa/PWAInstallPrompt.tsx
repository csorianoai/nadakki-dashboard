"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "nadakki_pwa_dismiss_until";
const VISIT_KEY = "nadakki_pwa_visits";
const MIN_VISITS = 3;
const MIN_SECONDS = 30;
const DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check dismissal expiry
    try {
      const until = localStorage.getItem(DISMISS_KEY);
      if (until && Date.now() < Number(until)) return;
    } catch {}

    // Increment visit counter
    let visits = 1;
    try {
      visits = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
      localStorage.setItem(VISIT_KEY, String(visits));
    } catch {}

    if (visits < MIN_VISITS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      // Wait MIN_SECONDS before showing
      timerRef.current = setTimeout(() => {
        setVisible(true);
      }, MIN_SECONDS * 1000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {}
    deferredPrompt = null;
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    deferredPrompt = null;
    try {
      const expiry = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(expiry));
    } catch {}
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
            <Download className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Instalar Nadakki</h3>
            <p className="text-sm text-slate-400 mt-1">
              Instala la app para acceso rapido desde tu pantalla de inicio.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors min-h-[44px]"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors min-h-[44px]"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
