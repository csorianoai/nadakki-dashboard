"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[min(90vh,720px)] w-[min(92vw,560px)] overflow-hidden rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-0 text-forgeInk-800 shadow-forge-lg backdrop:bg-forgeSurface-overlay",
        className
      )}
    >
      <div className="flex max-h-[min(90vh,720px)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-forgeInk-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-forge-md font-semibold text-forgeInk-800">{title}</h2>
            {description ? <p className="mt-1 text-forge-sm text-forgeInk-500">{description}</p> : null}
          </div>
          <IconButton aria-label="Close dialog" variant="subtle" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" aria-hidden />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-forge-sm">{children}</div>
        {footer ? <footer className="border-t border-forgeInk-100 px-6 py-4">{footer}</footer> : null}
      </div>
    </dialog>,
    document.body
  );
}
