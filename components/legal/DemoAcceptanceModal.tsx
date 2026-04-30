"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useKnowledgePackInfo } from "@/hooks/useLegal";

/** Bloqueo solo si el pack no está verificado (modo restrictivo). */
const STORAGE_KEY_V2 = "legal_post_sello_accepted";
const STORAGE_KEY_LEGACY = "legal_demo_accepted";
/** Panel informativo piloto (no bloqueante): una vez por sesión de navegador. */
const SESSION_OPTIONAL_DISMISSED = "legal_pilot_optional_info_dismissed";

export function DemoAcceptanceModal() {
  const router = useRouter();
  const { info, loading } = useKnowledgePackInfo("do");
  const verified = info?.verification_status === "verified";

  const [blockingAccepted, setBlockingAccepted] = useState(true);
  const [optionalDismissed, setOptionalDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(SESSION_OPTIONAL_DISMISSED) === "1";
  });

  useEffect(() => {
    setBlockingAccepted(window.localStorage.getItem(STORAGE_KEY_V2) === "true");
  }, []);

  useEffect(() => {
    if (!verified || typeof window === "undefined") return;
    setOptionalDismissed(sessionStorage.getItem(SESSION_OPTIONAL_DISMISSED) === "1");
  }, [verified]);

  const dismissOptional = () => {
    sessionStorage.setItem(SESSION_OPTIONAL_DISMISSED, "1");
    setOptionalDismissed(true);
  };

  if (loading) return null;

  /* Piloto controlado: aviso opcional, no modal a pantalla completa */
  if (verified) {
    if (optionalDismissed) return null;
    return (
      <div
        className="fixed bottom-4 right-4 z-40 w-[min(100vw-2rem,22rem)] rounded-lg border border-emerald-200 bg-white p-4 text-sm text-slate-700 shadow-lg relative"
        role="complementary"
        aria-label="Información de piloto controlado"
      >
        <button
          type="button"
          onClick={dismissOptional}
          className="absolute top-3 right-3 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 font-medium text-emerald-900">Piloto controlado</h2>
        <p className="mt-2 leading-relaxed">
          Knowledge pack RD verificado. Las respuestas usan <strong>LLM</strong> bajo políticas del Legal Core; no
          sustituyen consulta legal. Las copias pueden incluir marca{" "}
          <strong className="whitespace-nowrap">PILOTO CONTROLADO</strong>.
        </p>
        <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-md p-2">
          <strong>Capa 2:</strong> citas con ⚠️ siguen sin verificación automática contra fuente oficial.
        </p>
        <button
          type="button"
          onClick={dismissOptional}
          className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-emerald-800"
        >
          Entendido
        </button>
      </div>
    );
  }

  /* Pack no verificado: modal restrictivo obligatorio */
  if (blockingAccepted) return null;

  const handleAccept = () => {
    window.localStorage.setItem(STORAGE_KEY_V2, "true");
    window.localStorage.setItem(STORAGE_KEY_LEGACY, "true");
    setBlockingAccepted(true);
  };

  const handleCancel = () => {
    router.push("/legal");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="legal-restrict-modal-title"
    >
      <div className="max-w-lg space-y-4 rounded-xl border border-amber-200 bg-white p-6 shadow-xl">
        <h2 id="legal-restrict-modal-title" className="text-xl font-medium text-amber-950">
          Validación requerida
        </h2>
        <p className="leading-relaxed text-slate-700">
          El knowledge pack de este tenant <strong>no está en estado verificado</strong>. Esta vista opera en modo
          restrictivo: las salidas no constituyen consejo legal y no deben usarse para decisiones jurídicas
          definitivas.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Si continúa, acepta revisar toda salida con un abogado autorizado y no almacenar datos sensibles fuera de
          políticas de su organización.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-amber-600 px-5 py-2 text-white hover:bg-amber-700"
          >
            Entiendo los riesgos, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
