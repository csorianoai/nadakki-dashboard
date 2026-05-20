"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  estimateMonthlyUsd,
  hasCreditCoreSelected,
  useTenantOnboarding,
} from "@/hooks/useTenantOnboarding";

export function ReviewStep() {
  const { state, runActivation, activating, saving, lastSavedAt, pushDraft, goBack } = useTenantOnboarding();
  const [open, setOpen] = useState(false);
  const monthly = estimateMonthlyUsd(state);
  const credit = hasCreditCoreSelected(state);

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-review">
      <h2 className="text-lg font-semibold text-white mb-1">Revisión y activación</h2>
      <p className="text-sm text-gray-400 mb-6">Confirma la configuración antes de activar el tenant.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm">
          <h3 className="font-semibold text-white mb-2">Organización</h3>
          <dl className="space-y-1 text-gray-300">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Slug</dt>
              <dd className="font-mono text-xs">{state.step1.slug || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Nombre</dt>
              <dd>{state.step1.displayName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Contacto</dt>
              <dd className="break-all text-right">{state.step1.contactEmail || "—"}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm">
          <h3 className="font-semibold text-white mb-2">Coste estimado</h3>
          <p className="text-2xl font-bold text-emerald-300" data-testid="onboarding-estimate">
            USD {monthly.toLocaleString("es-DO")}
            <span className="text-sm font-normal text-gray-400"> /mes</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">Suma de tiers por core seleccionado (indicativo).</p>
        </section>
        <section className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm md:col-span-2">
          <h3 className="font-semibold text-white mb-2">Cores</h3>
          <ul className="flex flex-wrap gap-2">
            {state.step3.cores.map((c) => (
              <li
                key={c.core}
                className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-200"
                data-testid={`review-core-${c.core}`}
              >
                {c.core} · {c.tier}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm md:col-span-2">
          <h3 className="font-semibold text-white mb-2">Crédito / credenciales</h3>
          <p className="text-gray-400">
            {credit
              ? "Core de crédito activo — credenciales se enviarán al router correspondiente."
              : "Sin core de crédito — se omite el paso de bancos."}
          </p>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {lastSavedAt
            ? `Borrador guardado: ${new Date(lastSavedAt).toLocaleTimeString("es-DO")}`
            : saving
              ? "Guardando borrador…"
              : "Autoguardado cada 30s"}{" "}
          <button
            type="button"
            className="ml-2 text-cyan-400 underline"
            onClick={() => void pushDraft()}
            data-testid="onboarding-save-now"
          >
            Guardar ahora
          </button>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={activating}
          data-testid="onboarding-open-activate"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {activating && <Loader2 className="h-4 w-4 animate-spin" />}
          Activar tenant
        </button>
      </div>

      <div className="mt-8 flex justify-start">
        <button
          type="button"
          onClick={() => goBack(6)}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-gray-200 hover:bg-white/10"
        >
          Atrás
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md border border-white/10 bg-zinc-950 text-white"
          data-testid="onboarding-confirm-dialog"
        >
          <DialogHeader>
            <DialogTitle>Confirmar activación</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta acción enviará la configuración al backend y activará el período de gracia.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            Se enviará la configuración al backend. Recibirás{" "}
            <strong className="text-gray-200">acceso provisional (24h)</strong> mientras finalizamos DNS y SSO.
          </p>
          <p className="text-sm text-gray-300">
            Coste estimado: <span className="font-semibold text-emerald-300">USD {monthly}/mes</span>
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300"
              onClick={() => setOpen(false)}
              data-testid="onboarding-cancel-activate"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              data-testid="onboarding-confirm-activate"
              onClick={() => {
                setOpen(false);
                void runActivation();
              }}
            >
              Confirmar activación
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
