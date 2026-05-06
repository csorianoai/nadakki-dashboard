"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CasePriority, CaseType } from "@/lib/legal/cases/case-types";
import { createCase } from "@/lib/legal/cases/legal-cases-api";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseTypeSelector } from "@/components/legal/cases/CaseTypeSelector";

type Mode = "evaluacion" | "ingesta";

export function CaseCreateWizard({ tenantId }: { tenantId: string }) {
  const m = useLegalCasesMessages();
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>("ingesta");
  const [caseType, setCaseType] = useState<CaseType>("defensa_civil_cobro_pesos");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<CasePriority>("normal");
  const [clientName, setClientName] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      createCase(tenantId, {
        case_type: caseType,
        title: title.trim(),
        priority,
        initial_state: mode === "evaluacion" ? "EVALUACION_INICIAL" : "INGESTION",
        initial_actors: [
          {
            role: "cliente",
            is_primary: true,
            actor_kind: "persona_fisica",
            full_name: clientName.trim(),
            conflict_check_done: false,
            conflict_detected: false,
          },
          ...(counterpartyName.trim()
            ? [
                {
                  role: "contraparte",
                  is_primary: false,
                  actor_kind: "persona_juridica" as const,
                  full_name: counterpartyName.trim(),
                  conflict_check_done: false,
                  conflict_detected: false,
                },
              ]
            : []),
        ],
      }),
    onSuccess: async (c) => {
      await qc.invalidateQueries({ queryKey: ["legal_cases", tenantId] });
      router.push(`/legal/cases/${c.case_id}`);
    },
  });

  const next = () => {
    setErr(null);
    if (step === 1 && !title.trim()) {
      setErr(m.wizard.errors.title_required);
      return;
    }
    if (step === 2 && !clientName.trim()) {
      setErr(m.wizard.errors.client_required);
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="mx-auto max-w-2xl rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-6 shadow-forge-xs">
      <h1 className="text-xl font-semibold text-forgeInk-900">{m.wizard.title}</h1>
      <p className="mt-1 text-sm text-forgeInk-600">
        Paso {step} de 3 — {m.wizard.steps[String(step) as "1" | "2" | "3"]}
      </p>

      <div className="mt-4 flex gap-4 border-b border-forgeInk-100 pb-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" checked={mode === "evaluacion"} onChange={() => setMode("evaluacion")} />
          {m.wizard.mode.evaluacion}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" checked={mode === "ingesta"} onChange={() => setMode("ingesta")} />
          {m.wizard.mode.ingesta}
        </label>
      </div>

      {err ? (
        <p className="mt-3 text-sm text-forgeDanger-700" role="alert">
          {err}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 space-y-4">
          <CaseTypeSelector value={caseType} onChange={setCaseType} />
          <label className="block text-sm font-medium text-forgeInk-800">
            Título del expediente
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-forgeInk-800">
            Prioridad
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CasePriority)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-3 py-2"
            >
              {(Object.keys(m.priority) as CasePriority[]).map((p) => (
                <option key={p} value={p}>
                  {m.priority[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-forgeInk-800">
            Nombre del cliente
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-forgeInk-800">
            Contraparte (opcional)
            <input
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-3 py-2"
            />
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-3 text-sm text-forgeInk-700">
          <p>{m.wizard.steps["3"]}: puedes adjuntar documentos después desde el detalle del expediente.</p>
          <ul className="list-inside list-disc text-forgeInk-600">
            <li>
              {m.case_types[caseType]} — {title}
            </li>
            <li>
              Cliente: {clientName || "—"}
            </li>
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex justify-between gap-2">
        <button
          type="button"
          className="rounded-forge-sm px-4 py-2 text-sm text-forgeInk-700 ring-1 ring-forgeInk-200"
          onClick={back}
          disabled={step === 1}
        >
          Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50"
            onClick={next}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            disabled={mut.isPending}
            className="rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50 disabled:opacity-50"
            onClick={() => mut.mutate()}
          >
            {m.wizard.submit}
          </button>
        )}
      </div>
    </div>
  );
}
