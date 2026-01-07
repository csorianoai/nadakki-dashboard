"use client";
import { useState, useEffect } from "react";
import { Download, X, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function PWAPrompt() {
  const { isInstalled, isOnline, canInstall, isUpdateAvailable, install, update } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  // Show offline indicator briefly when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      const timer = setTimeout(() => setShowOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Install prompt
  if (canInstall && !isInstalled && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Instalar NADAKKI</h3>
              <p className="text-sm text-slate-400 mt-1">
                Instala la app para acceso rápido y uso offline.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={install}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                >
                  Instalar
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600"
                >
                  Ahora no
                </button>
              </div>
            </div>
            <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update available
  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-blue-900/90 border border-blue-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-white">Actualización disponible</h3>
              <p className="text-sm text-blue-200">Nueva versión lista para instalar.</p>
            </div>
            <button
              onClick={update}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Offline indicator
  if (showOffline && !isOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="bg-amber-900/90 border border-amber-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-200">Sin conexión</span>
        </div>
      </div>
    );
  }

  return null;
}