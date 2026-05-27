"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/forge";
import { ProyectoDeleteModal } from "@/components/proyectos/ProyectoDeleteModal";

interface ProyectoDangerZoneProps {
  tenantId: string;
  proyectoId: string;
  projectLabel?: string;
}

export function ProyectoDangerZone({ tenantId, proyectoId, projectLabel }: ProyectoDangerZoneProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <p className="text-sm text-zinc-400">
          Selecciona una institución (tenant) para habilitar acciones de eliminación.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="font-display text-forge-sm font-semibold text-rose-200">Zona de peligro</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Eliminar un proyecto lo cancela en la máquina de estados y lo archiva (soft delete). Los documentos,
          facturas y deals asociados se conservan, pero el proyecto dejará de aparecer en el Portafolio.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-4 min-h-11"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Eliminar proyecto
        </Button>
      </div>

      <ProyectoDeleteModal
        open={deleteOpen}
        tenantId={tenantId}
        proyectoId={proyectoId}
        projectLabel={projectLabel}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
