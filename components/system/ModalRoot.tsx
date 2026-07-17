"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalContextType = {
  openModal: (modal: ReactNode) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

/** Global modal host — portals to document.body outside /autos subtree. */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ReactNode | null>(null);

  const openModal = useCallback((modal: ReactNode) => setCurrentModal(modal), []);
  const closeModal = useCallback(() => setCurrentModal(null), []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {currentModal && typeof document !== "undefined"
        ? createPortal(currentModal, document.body)
        : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

const BACKDROP_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 20, 30, 0.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  zIndex: 9998,
};

const PANEL_STYLE: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(480px, calc(100vw - 40px))",
  maxHeight: "min(85vh, calc(100vh - 40px))",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: 12,
  boxShadow: "0 24px 56px -18px rgba(15, 23, 42, 0.26)",
};

export function FixedModal({
  open,
  onClose,
  title,
  titleId = "fixed-modal-title",
  subtitle,
  icon,
  children,
  footer,
  showClose = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showClose?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button:not([aria-label="Cerrar"])',
      );
      first?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div role="presentation" aria-hidden style={BACKDROP_STYLE} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={PANEL_STYLE}
        className="border border-nk-border bg-nk-surface text-nk-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-nk-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon}
              <h2 id={titleId} className="font-manrope text-lg font-bold text-nk-fg">
                {title}
              </h2>
            </div>
            {subtitle ? <div className="mt-1 text-sm text-nk-fg-muted">{subtitle}</div> : null}
          </div>
          {showClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-r-sm text-nk-fg-muted hover:bg-nk-surface-2"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-nk-border">{footer}</footer>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
