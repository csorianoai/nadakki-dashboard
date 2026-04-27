"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, MessageCircle, Minimize2, X } from "lucide-react";
import { ForgeButton } from "../primitives/ForgeButton";
import { cn } from "@/lib/utils";

interface GuideStep {
  title: string;
  body: string;
  question?: string;
  cta?: {
    label: string;
    href: string;
  };
}

const dashboardSteps: GuideStep[] = [
  {
    title: "Punto de inicio",
    body: "Aqui ves el pulso del portafolio: solicitudes recientes, pendientes y actividad de la semana.",
    question: "Quieres crear una solicitud nueva?",
    cta: { label: "Nueva Solicitud", href: "/credit-hub/dealer/applications/new" },
  },
  {
    title: "Nueva Solicitud",
    body: "Cuando estes listo, usa el boton Nueva Solicitud. Te voy a guiar por partes para construir un perfil financiero completo.",
    cta: { label: "Empezar", href: "/credit-hub/dealer/applications/new" },
  },
];

const newApplicationSteps: GuideStep[] = [
  {
    title: "Perfil del cliente",
    body: "Empieza con identidad y contacto. Esta base ayuda a reconocer a la persona detras de la solicitud.",
    question: "Tienes la cedula y datos de contacto a mano?",
  },
  {
    title: "Ingresos",
    body: "La parte laboral cuenta como entra dinero y que tan estable es. No busques perfeccion, busca claridad.",
    question: "El ingreso mensual esta confirmado?",
  },
  {
    title: "Vehiculo",
    body: "El producto financiado importa: precio, condicion y dealer ayudan a entender el valor de la operacion.",
    question: "Ya tienes la proforma o precio de referencia?",
  },
  {
    title: "Riesgo",
    body: "Deudas, mora y consentimientos completan el panorama. Antes de enviar, recuerda: esto no es un formulario, es un perfil financiero.",
    question: "Los consentimientos estan completos?",
  },
];

const listSteps: GuideStep[] = [
  {
    title: "Pipeline de solicitudes",
    body: "Aqui puedes buscar por cliente o id y filtrar por estado. Si el cliente pregunta por avance, este es el lugar para orientarte.",
    question: "Quieres revisar una solicitud especifica?",
  },
];

const detailSteps: GuideStep[] = [
  {
    title: "Expediente crediticio",
    body: "Esta pantalla ya no es captura: es el expediente de la solicitud. Aqui se ve la historia y el estado real.",
  },
  {
    title: "Procesar con IA",
    body: "El boton Procesar con IA analiza la solicitud contra casos reales y ayuda a traducir datos en decision.",
    question: "Quieres revisar el riesgo antes de procesar?",
  },
  {
    title: "Resultado con impacto",
    body: "Cuando haya resultado, leelo en terminos simples: aprobacion, nivel de riesgo y proxima decision para el cliente.",
  },
];

function stepsForPath(pathname: string): GuideStep[] {
  if (pathname === "/credit-hub/dealer") return dashboardSteps;
  if (pathname === "/credit-hub/dealer/applications") return listSteps;
  if (pathname === "/credit-hub/dealer/applications/new") return newApplicationSteps;
  if (pathname.startsWith("/credit-hub/dealer/applications/")) return detailSteps;
  return dashboardSteps;
}

export function ForgeCreditGuide() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [index, setIndex] = useState(0);

  const steps = useMemo(() => stepsForPath(pathname), [pathname]);
  const current = steps[Math.min(index, steps.length - 1)];

  if (dismissed) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full border border-forge-border bg-forge-surface-elevated px-4 py-3 text-sm font-medium text-forge-text shadow-xl lg:bottom-6"
        aria-label="Abrir guia de credito"
      >
        <MessageCircle className="h-4 w-4 text-forge-primary" />
        Guia
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl border border-forge-border bg-forge-surface-elevated p-4 shadow-2xl lg:bottom-6 lg:right-auto lg:w-96"
      aria-label="Guia de evaluacion crediticia"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forge-primary/15">
            <MessageCircle className="h-4 w-4 text-forge-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-forge-text-muted">Asistente Forge</p>
            <h2 className="font-display text-lg font-bold text-forge-text">{current.title}</h2>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded-lg p-1.5 text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
            aria-label="Minimizar guia"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
            aria-label="Cerrar guia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm leading-6 text-forge-text-muted">{current.body}</p>
      {current.question && <p className="mt-3 text-sm font-medium text-forge-text">{current.question}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1" aria-label="Progreso de guia">
          {steps.map((step, stepIndex) => (
            <span
              key={step.title}
              className={cn("h-1.5 w-5 rounded-full", stepIndex === index ? "bg-forge-primary" : "bg-forge-border")}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {current.cta && (
            <Link href={current.cta.href}>
              <ForgeButton size="sm" variant="primary">
                {current.cta.label}
              </ForgeButton>
            </Link>
          )}
          {steps.length > 1 && (
            <ForgeButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIndex((value) => (value + 1) % steps.length)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Siguiente
            </ForgeButton>
          )}
        </div>
      </div>
    </aside>
  );
}
