"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { FixedModal } from "@/components/system/ModalRoot";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: 1,
    title: "Ingresa tus datos financieros básicos",
    desc: "Ingresos, deuda mensual e inicial disponible — sin afectar tu score.",
  },
  {
    n: 2,
    title: "Recibe pre-aprobaciones en 24h",
    desc: "Credicefi + Banco Piloto RD responden con montos y tasas reales.",
  },
  {
    n: 3,
    title: "Ve solo vehículos compatibles",
    desc: "Filtramos el inventario según tu aprobación real, no estimaciones.",
  },
] as const;

export function MatchMyApprovalModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <FixedModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Match My Approval"
      titleId="match-approval-modal-title"
      icon={<Sparkles className="h-5 w-5 text-brand" aria-hidden />}
      subtitle="Pre-calificación multi-banco — exclusivo Nadakki Auto"
      footer={
        <div className="flex flex-col gap-2 px-5 py-4">
          <Button variant="brand" className="w-full font-manrope font-semibold" asChild>
            <Link href="/autos#comparador" onClick={() => onOpenChange(false)}>
              Iniciar solicitud
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm font-semibold text-nk-fg-muted hover:text-brand"
          >
            Ahora no
          </button>
        </div>
      }
    >
      <div className="space-y-4 px-5 py-4">
        {STEPS.map((step) => (
          <div key={step.n} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-manrope text-sm font-bold text-brand">
              {step.n}
            </span>
            <div>
              <p className="font-semibold text-nk-fg">{step.title}</p>
              <p className="mt-0.5 text-sm text-nk-fg-muted">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </FixedModal>
  );
}
