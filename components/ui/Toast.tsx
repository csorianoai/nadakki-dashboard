"use client";
import { createContext, useContext, useState, useCallback, ReactNode, memo } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, action?: Toast["action"]) => void;
  error: (title: string, message?: string, action?: Toast["action"]) => void;
  warning: (title: string, message?: string, action?: Toast["action"]) => void;
  info: (title: string, message?: string, action?: Toast["action"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: "bg-green-500/10", border: "border-green-500/20", icon: "text-green-500" },
  error: { bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-500" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-500" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-500" },
};

const ToastItem = memo(function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  return (
    <div className={"flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl " + colors.bg + " " + colors.border + " animate-slide-in"}>
      <Icon className={"w-5 h-5 flex-shrink-0 mt-0.5 " + colors.icon} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.message && <p className="text-sm text-slate-400 mt-1">{toast.message}</p>}
        {toast.action && (
          <button
            onClick={() => { toast.action?.onClick(); onClose(); }}
            className="mt-2 text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    
    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Limit stack to MAX_TOASTS
      if (updated.length > MAX_TOASTS) {
        return updated.slice(-MAX_TOASTS);
      }
      return updated;
    });

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string, action?: Toast["action"]) => 
    addToast({ type: "success", title, message, action }), [addToast]);
  const error = useCallback((title: string, message?: string, action?: Toast["action"]) => 
    addToast({ type: "error", title, message, action }), [addToast]);
  const warning = useCallback((title: string, message?: string, action?: Toast["action"]) => 
    addToast({ type: "warning", title, message, action }), [addToast]);
  const info = useCallback((title: string, message?: string, action?: Toast["action"]) => 
    addToast({ type: "info", title, message, action }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
}

export default ToastContext;