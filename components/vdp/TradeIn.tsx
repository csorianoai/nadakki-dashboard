"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FixedModal } from "@/components/system/ModalRoot";

export function TradeIn() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSubmit = () => {
    setOpen(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 4000);
  };

  return (
    <>
      <section className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
        <div className="flex gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-r-sm bg-brand-soft text-brand">
            <ArrowLeftRight className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-manrope text-base font-bold text-nk-fg">¿Trade-in?</h2>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Evaluación instantánea de tu vehículo actual con Nadakki AI
            </p>
            <Button variant="outline" className="mt-3" onClick={() => setOpen(true)}>
              Añadir datos de mi vehículo
            </Button>
          </div>
        </div>
      </section>

      <FixedModal
        open={open}
        onClose={() => setOpen(false)}
        title="Evaluar trade-in"
        subtitle="Completa los datos de tu vehículo actual"
      >
        <div className="space-y-4 px-5 py-4">
          {[
            { id: "make", label: "Marca", placeholder: "Toyota" },
            { id: "model", label: "Modelo", placeholder: "Corolla" },
            { id: "year", label: "Año", placeholder: "2019" },
            { id: "km", label: "Kilometraje", placeholder: "65,000" },
            { id: "condition", label: "Estado", placeholder: "Bueno" },
          ].map(({ id, label, placeholder }) => (
            <label key={id} className="block">
              <span className="text-sm font-medium text-nk-fg">{label}</span>
              <input
                type="text"
                placeholder={placeholder}
                className="mt-1 w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>
          ))}
          <Button variant="brand" className="w-full" onClick={handleSubmit}>
            Evaluar con AI
          </Button>
        </div>
      </FixedModal>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 right-6 z-[60] max-w-sm animate-nkToast rounded-r border border-nk-border bg-nk-surface px-4 py-3 text-sm shadow-nk-lg"
        >
          Evaluación en proceso. Recibirás resultado en 24h
        </div>
      ) : null}
    </>
  );
}
