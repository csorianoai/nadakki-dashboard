"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getDocument } from "@/lib/api/stipulations";
import type { StipulationsApiRole } from "@/lib/api/stipulations-types";

export interface DocumentPreviewModalProps {
  open: boolean;
  applicationId: string;
  stipulationId: string;
  role: StipulationsApiRole;
  title: string;
  onClose: () => void;
}

export function DocumentPreviewModal({
  open,
  applicationId,
  stipulationId,
  role,
  title,
  onClose,
}: DocumentPreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setMime(null);
      setErr(null);
      return;
    }
    let revoked: string | null = null;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const blob = await getDocument(applicationId, stipulationId, undefined, role);
        const u = URL.createObjectURL(blob);
        revoked = u;
        setUrl(u);
        setMime(blob.type || null);
      } catch {
        setErr("No se pudo cargar el documento.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, applicationId, stipulationId, role]);

  if (!open) return null;

  const isImage = mime?.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/50 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de documento"
    >
      <div className="flex items-center justify-between bg-forgeGray-900 px-4 py-3 text-white">
        <p className="m-0 max-w-[80%] truncate text-sm font-medium">{title}</p>
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-white/10"
          onClick={onClose}
          aria-label="Cerrar vista previa"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-forgeGray-100 p-4">
        {loading ? (
          <div className="mx-auto max-w-3xl space-y-3" aria-busy="true">
            <div className="h-64 animate-pulse rounded-xl bg-forgeGray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-forgeGray-200" />
          </div>
        ) : err ? (
          <p className="text-center text-forge-sm text-rose-700">{err}</p>
        ) : url && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="mx-auto max-h-[calc(100vh-8rem)] max-w-full object-contain" />
        ) : url ? (
          <iframe title={title} src={url} className="mx-auto h-[calc(100vh-8rem)] w-full max-w-4xl rounded-lg bg-white" />
        ) : null}
      </div>
    </div>
  );
}
