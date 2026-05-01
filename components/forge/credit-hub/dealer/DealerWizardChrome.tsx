"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Modal } from "@/components/forge";
import { cn } from "@/lib/utils";
import { DEALER_WIZARD_STEP_PATHS, dealerWizardStepHref } from "./dealerWizardPaths";
import { useDealerWizard } from "./DealerWizardProvider";

const STEP_LABELS = ["1 Solicitante", "2 Co-firmante", "3 Vehículo", "4 Documentos", "5 Consentimiento"] as const;

export function DealerWizardChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { stepIndex, goNext, goPrev, saveDraftToStorage, submitApplication, canAdvance, isSubmitting, submitError } = useDealerWizard();
  const [exitOpen, setExitOpen] = useState(false);

  const handleExitConfirm = () => {
    saveDraftToStorage();
    setExitOpen(false);
    router.push("/credit-hub/dealer");
  };

  const handlePrimary = async () => {
    if (stepIndex < 4) {
      goNext();
      return;
    }
    try {
      const r = await submitApplication();
      router.push(`/credit-hub/dealer/applications/new/complete?application_id=${encodeURIComponent(r.application_id)}`);
    } catch {
      /* error surfaced via submitError */
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col pb-28">
      <header className="border-b border-forgeInk-200 bg-forgeSurface-card px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="text-left text-forge-xs font-medium text-forgeBrand-600 underline-offset-2 hover:underline"
              onClick={() => setExitOpen(true)}
            >
              ← Volver al panel
            </button>
            <Link href="/credit-hub/dealer/applications" className="text-forge-xs text-forgeInk-500 hover:text-forgeInk-700">
              Mis solicitudes
            </Link>
          </div>
          <nav aria-label="Progreso del formulario" className="flex flex-wrap gap-1.5">
            {DEALER_WIZARD_STEP_PATHS.map((slug, i) => {
              const active = i === stepIndex;
              const done = i < stepIndex;
              const muted = i > stepIndex;
              return (
                <Link
                  key={slug}
                  href={dealerWizardStepHref(slug)}
                  className={cn(
                    "rounded-forge-sm px-2.5 py-1.5 text-forge-xs font-medium transition-colors",
                    active && "bg-forgeBrand-500 text-white shadow-forge-sm",
                    !active && done && "bg-forgeInk-100 text-forgeInk-800",
                    !active && !done && muted && "bg-forgeSurface-sunken text-forgeInk-400",
                    !active && !done && !muted && "bg-forgeInk-50 text-forgeInk-600"
                  )}
                >
                  {STEP_LABELS[i]}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 md:px-8">{children}</main>
      {submitError ? (
        <p className="mx-auto max-w-3xl px-4 text-forge-xs text-forgeDanger-600 md:px-8" role="alert">
          {submitError}
        </p>
      ) : null}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-forgeInk-200 bg-forgeSurface-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between gap-2">
          <Button type="button" variant="secondary" className="min-h-12 min-w-0 flex-1 shrink" onClick={goPrev} disabled={stepIndex === 0}>
            Anterior
          </Button>
          <Button type="button" variant="ghost" className="min-h-12 shrink-0 px-2 text-forge-xs" onClick={saveDraftToStorage}>
            Guardar borrador
          </Button>
          {stepIndex < 4 ? (
            <Button type="button" variant="primary" className="min-h-12 min-w-0 flex-1 shrink" onClick={goNext} disabled={!canAdvance}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="min-h-12 min-w-0 flex-1 shrink"
              onClick={() => void handlePrimary()}
              disabled={!canAdvance || isSubmitting}
            >
              {isSubmitting ? "Enviando…" : "Enviar solicitud"}
            </Button>
          )}
        </div>
      </div>
      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="¿Guardar borrador y salir?"
        description="Tu progreso se guarda en este dispositivo cada 10 segundos y al confirmar."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setExitOpen(false)}>
              Continuar editando
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/credit-hub/dealer")}>
              Salir sin guardar
            </Button>
            <Button type="button" variant="primary" onClick={handleExitConfirm}>
              Guardar borrador y salir
            </Button>
          </div>
        }
      >
        <p className="text-forge-sm text-forgeInk-600">
          Si sales sin guardar, los datos no enviados pueden perderse en otro navegador o dispositivo. Usa &quot;Guardar borrador y salir&quot; para
          volcar ahora en el almacenamiento local.
        </p>
      </Modal>
    </div>
  );
}
