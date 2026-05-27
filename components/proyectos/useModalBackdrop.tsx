"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export function useModalBackdrop(open: boolean, onClose: () => void, disabled = false) {
  const handleClose = useCallback(() => {
    if (!disabled) onClose();
  }, [disabled, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            role="presentation"
            aria-hidden
            onClick={handleClose}
          />,
          document.body,
        )
      : null;

  return { overlay, handleClose };
}
