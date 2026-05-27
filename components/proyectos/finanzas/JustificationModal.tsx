"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, Modal } from "@/components/forge";

const MIN_LEN = 10;

interface JustificationModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

export function JustificationModal({
  open,
  title,
  description,
  confirmLabel,
  variant = "primary",
  loading = false,
  onClose,
  onConfirm,
}: JustificationModalProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const trimmed = text.trim();
  const canConfirm = trimmed.length >= MIN_LEN;

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" role="presentation" onClick={handleClose} />,
          document.body,
        )
      : null;

  return (
    <>
      {overlay}
      <Modal
        open={open}
        onClose={handleClose}
        closeOnBackdropClick={false}
        className="!z-50 backdrop:bg-transparent"
        title={title}
        description={description}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={variant === "danger" ? "danger" : "primary"}
              disabled={!canConfirm || loading}
              onClick={() => onConfirm(trimmed)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
            </Button>
          </div>
        }
      >
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          placeholder="Justificación (mínimo 10 caracteres)…"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100"
        />
        <p className={`mt-1.5 text-xs ${canConfirm ? "text-emerald-400" : "text-zinc-500"}`}>
          {trimmed.length}/{MIN_LEN} mínimo
        </p>
      </Modal>
    </>
  );
}
