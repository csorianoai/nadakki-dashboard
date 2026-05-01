"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
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

  const onOverlayMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-forgeInk-800 backdrop:bg-forgeSurface-overlay"
    >
      <div
        role="presentation"
        className={cn("flex h-full w-full", side === "right" ? "justify-end" : "justify-start")}
        onMouseDown={onOverlayMouseDown}
      >
        <div
          className={cn(
            "flex h-full w-[min(100vw,400px)] flex-col border-forgeInk-200 bg-forgeSurface-card shadow-forge-lg",
            side === "right" ? "border-l" : "border-r",
            className
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-forgeInk-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-forge-md font-semibold text-forgeInk-800">{title}</h2>
              {description ? <p className="mt-1 text-forge-sm text-forgeInk-500">{description}</p> : null}
            </div>
            <IconButton aria-label="Close panel" variant="subtle" onClick={onClose} className="shrink-0">
              <X className="h-4 w-4" aria-hidden />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-forge-sm">{children}</div>
          {footer ? <footer className="border-t border-forgeInk-100 px-5 py-4">{footer}</footer> : null}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
