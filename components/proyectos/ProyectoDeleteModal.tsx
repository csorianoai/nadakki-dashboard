"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Modal } from "@/components/forge";
import {
  deleteProyecto,
  ProyectosApiError,
  transitionProyectoState,
} from "@/app/hooks/useProyectos";
import { useModalBackdrop } from "@/components/proyectos/useModalBackdrop";

const MIN_JUSTIFICATION = 10;

function apiErrorMessage(err: unknown): string {
  if (err instanceof ProyectosApiError) {
    if (err.body && typeof err.body === "object" && "detail" in (err.body as object)) {
      const detail = (err.body as Record<string, unknown>).detail;
      if (typeof detail === "string") return detail;
      if (detail) return JSON.stringify(detail);
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Error desconocido";
}

interface ProyectoDeleteModalProps {
  open: boolean;
  tenantId: string;
  proyectoId: string;
  projectLabel?: string;
  onClose: () => void;
}

export function ProyectoDeleteModal({
  open,
  tenantId,
  proyectoId,
  projectLabel,
  onClose,
}: ProyectoDeleteModalProps) {
  const router = useRouter();
  const [justification, setJustification] = useState("");
  const [deleting, setDeleting] = useState(false);

  const trimmedLen = justification.trim().length;
  const canDelete = trimmedLen >= MIN_JUSTIFICATION;

  const { overlay, handleClose } = useModalBackdrop(open, onClose, deleting);

  const handleOpenChange = useCallback(() => {
    if (!deleting) {
      setJustification("");
      onClose();
    }
  }, [deleting, onClose]);

  const handleDelete = useCallback(async () => {
    if (!tenantId || !canDelete) return;

    setDeleting(true);
    try {
      await transitionProyectoState(tenantId, proyectoId, "CANCELADO", justification.trim());
      await deleteProyecto(tenantId, proyectoId);
      toast.success("Proyecto eliminado");
      onClose();
      router.push("/proyectos/portafolio");
    } catch (err) {
      toast.error("No se pudo eliminar el proyecto", { description: apiErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  }, [canDelete, justification, onClose, proyectoId, router, tenantId]);

  return (
    <>
      {overlay}
      <Modal
        open={open}
        onClose={handleOpenChange}
        closeOnBackdropClick={false}
        className="!z-50 backdrop:bg-transparent"
        title="¿Eliminar este proyecto?"
        description={
          projectLabel
            ? `Proyecto: ${projectLabel}. Esta acción cancelará y archivará el proyecto.`
            : "Esta acción cancelará y archivará el proyecto."
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={deleting} onClick={handleOpenChange}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!canDelete || deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Eliminando…
                </>
              ) : (
                "Eliminar definitivamente"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden />
            <div className="space-y-2 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Esta acción:</p>
              <ul className="list-disc space-y-1 pl-4 text-zinc-400">
                <li>Cancelará el proyecto (estado → CANCELADO).</li>
                <li>Lo archivará (soft delete).</li>
                <li>Los documentos, facturas y deals asociados se preservarán.</li>
                <li>El proyecto desaparecerá del Portafolio.</li>
              </ul>
              <p className="text-xs text-zinc-500">
                Esta acción se puede revertir solo por un administrador desde la papelera (próximamente).
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="delete-justification" className="mb-1.5 block text-sm font-medium text-zinc-200">
              Justificación (mínimo {MIN_JUSTIFICATION} caracteres)
            </label>
            <textarea
              id="delete-justification"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={deleting}
              placeholder="Describe el motivo de la eliminación…"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-rose-400/50 focus:outline-none focus:ring-1 focus:ring-rose-400/40 disabled:opacity-60"
            />
            <p
              className={`mt-1.5 text-xs ${canDelete ? "text-emerald-400" : "text-zinc-500"}`}
              aria-live="polite"
            >
              {trimmedLen}/{MIN_JUSTIFICATION} mínimo
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
