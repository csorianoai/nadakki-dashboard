"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const toastStore = {
  toasts: [] as Toast[],
  listeners: new Set<() => void>(),
  add(toast: Omit<Toast, "id">) {
    const newToast = { ...toast, id: Math.random().toString(36).slice(2, 11) };
    this.toasts = [...this.toasts, newToast];
    this.listeners.forEach((listener) => listener());
    window.setTimeout(() => this.remove(newToast.id), toast.duration || 4000);
  },
  remove(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.listeners.forEach((listener) => listener());
  },
};

export const forgeToast = {
  success: (message: string) => toastStore.add({ message, type: "success" }),
  error: (message: string) => toastStore.add({ message, type: "error" }),
  info: (message: string) => toastStore.add({ message, type: "info" }),
  warning: (message: string) => toastStore.add({ message, type: "warning" }),
};

export function ForgeToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const update = () => setToasts([...toastStore.toasts]);
    toastStore.listeners.add(update);
    update();
    return () => {
      toastStore.listeners.delete(update);
    };
  }, []);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-forge-success" />,
    error: <AlertCircle className="h-5 w-5 text-forge-danger" />,
    warning: <AlertCircle className="h-5 w-5 text-forge-warning" />,
    info: <Info className="h-5 w-5 text-forge-info" />,
  };

  return (
    <div className="pointer-events-none fixed bottom-24 right-6 z-[1080] space-y-2 lg:bottom-6" role="region" aria-label="Notificaciones">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100 }}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-4 shadow-2xl backdrop-blur-md"
            role="status"
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-forge-text">{toast.message}</p>
            <button onClick={() => toastStore.remove(toast.id)} className="text-forge-text-muted hover:text-forge-text" aria-label="Cerrar notificación">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
