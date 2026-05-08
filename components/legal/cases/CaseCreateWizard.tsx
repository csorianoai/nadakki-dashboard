"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { CasePriority, CaseType } from "@/lib/legal/cases/case-types";
import { createCase } from "@/lib/legal/cases/legal-cases-api";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseTypeSelector } from "@/components/legal/cases/CaseTypeSelector";
import { DocumentDropzone } from "@/components/shared/DocumentDropzone";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/lib/shared/document-upload-types";

type Mode = "evaluacion" | "ingesta";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30";

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
  const [caseDocs, setCaseDocs] = useState<UploadedFile[]>([]);
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
          ...(counterpartyName.trim() ? [
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
    if (step === 1) {
      const hasReady = caseDocs.some((f) => f.status === "ready");
      if (!hasReady) {
        setErr(m.wizard.errors.documents_required);
        return;
      }
    }
    if (step === 2 && !title.trim()) {
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

  const steps = [1, 2, 3] as const;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-xl md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-100">{m.wizard.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {m.wizard.steps[String(step) as "1" | "2" | "3"]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  step >= s
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                    : "border border-zinc-700 bg-zinc-900/50 text-zinc-500"
                )}
                layout
              >
                {s}
              </motion.div>
              {s < 3 ? <span className="h-px w-4 bg-zinc-800" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-b border-zinc-800/50 pb-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="radio"
            className="border-zinc-600 text-violet-500 focus:ring-violet-500"
            checked={mode === "evaluacion"}
            onChange={() => setMode("evaluacion")}
          />
          {m.wizard.mode.evaluacion}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="radio"
            className="border-zinc-600 text-violet-500 focus:ring-violet-500"
            checked={mode === "ingesta"}
            onChange={() => setMode("ingesta")}
          />
          {m.wizard.mode.ingesta}
        </label>
      </div>

      {err ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          <p className="text-sm text-zinc-400">
            Sube uno o más documentos (demandas, contratos, notificaciones). La IA extraerá un borrador de datos; en
            desarrollo la extracción es simulada.
          </p>
          <DocumentDropzone
            uploadedFiles={caseDocs}
            onFilesChange={setCaseDocs}
            title="Sube los documentos del caso"
            subtitle="Arrastra archivos o usa el selector (móvil)"
            onUploadComplete={(ready) => {
              const first = ready.find((r) => r.status === "ready")?.extractedData;
              if (!first) return;
              setTitle((t) => (t.trim() ? t : first.suggested_case_title ?? t));
              setClientName((c) => (c.trim() ? c : first.parties?.[0] ?? c));
              setCounterpartyName((cp) => (cp.trim() ? cp : first.parties?.[1] ?? cp));
            }}
          />
          <CaseTypeSelector value={caseType} onChange={setCaseType} />
          <label className="block text-sm font-medium text-zinc-300">
            Prioridad
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CasePriority)}
              className={inputClass}
            >
              {(Object.keys(m.priority) as CasePriority[]).map((p) => (
                <option key={p} value={p}>
                  {m.priority[p]}
                </option>
              ))}
            </select>
          </label>
        </motion.div>
      ) : null}

      {step === 2 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          <p className="text-sm text-zinc-500">
            Revisa y corrige los datos sugeridos a partir de los documentos. Puedes editarlos antes de crear el
            expediente.
          </p>
          <label className="block text-sm font-medium text-zinc-300">
            Título del expediente
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Nombre del cliente
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Contraparte (opcional)
            <input
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              className={inputClass}
            />
          </label>
        </motion.div>
      ) : null}

      {step === 3 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-3 text-sm text-zinc-300"
        >
          <p>Confirma la creación del expediente. Podrás adjuntar más documentos desde el detalle.</p>
          <ul className="list-inside list-disc text-zinc-400">
            <li>
              {m.case_types[caseType]} — {title}
            </li>
            <li>
              Cliente: {clientName || "—"}
            </li>
            <li>Documentos cargados en el paso 1: {caseDocs.filter((f) => f.status === "ready").length}</li>
          </ul>
        </motion.div>
      ) : null}

      <div className="mt-8 flex justify-between gap-2">
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm text-zinc-300 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-900 disabled:opacity-40"
          onClick={back}
          disabled={step === 1}
        >
          Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
            onClick={next}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            disabled={mut.isPending}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
            onClick={() => mut.mutate()}
          >
            {m.wizard.submit}
          </button>
        )}
      </div>
    </div>
  );
}
