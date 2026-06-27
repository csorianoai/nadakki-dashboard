"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { CasePriority, MatterArea, ProceduralStage } from "@/lib/legal/cases/case-types";
import { createCase } from "@/lib/legal/cases/legal-cases-api";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { MATERIAS, COVERAGE_BADGE, deriveCaseType } from "@/lib/legal/cases/matter-catalog";
import { ActorFormCard, type ActorFormData } from "@/components/legal/cases/ActorFormCard";
import { cn } from "@/lib/utils";

type Mode = "evaluacion" | "ingesta";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30";

const ROLE_OPTIONS = [
  "cliente",
  "contraparte",
  "demandante",
  "demandado",
  "imputado",
  "victima",
  "querellante",
  "testigo",
  "perito",
  "abogado_contrario",
  "juez",
  "fiscal",
  "notario",
  "garante",
  "tercero_interviniente",
] as const;

const MAX_PARTIES = 10;

function emptyActor(overrides?: Partial<ActorFormData>): ActorFormData {
  return {
    role: "contraparte",
    actor_kind: "persona_fisica",
    full_name: "",
    is_primary: false,
    ...overrides,
  };
}

function isActorEmpty(a: ActorFormData): boolean {
  return (
    !a.full_name.trim() &&
    !a.email?.trim() &&
    !a.phone?.trim() &&
    !a.identification_number?.trim()
  );
}

export function CaseCreateWizard({ tenantId }: { tenantId: string }) {
  const m = useLegalCasesMessages();
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>("ingesta");
  const [matterArea, setMatterArea] = useState<MatterArea | "">("");
  const [caseSubtype, setCaseSubtype] = useState("");
  const [customSubtype, setCustomSubtype] = useState("");
  const [proceduralStage, setProceduralStage] = useState<ProceduralStage | "">("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<CasePriority>("normal");
  const [actors, setActors] = useState<ActorFormData[]>([
    {
      role: "cliente",
      actor_kind: "persona_fisica",
      full_name: "",
      is_primary: true,
    },
  ]);
  const [err, setErr] = useState<string | null>(null);
  const [actorWarning, setActorWarning] = useState<string | null>(null);

  const updateActor = (index: number, updated: ActorFormData) => {
    setActors((prev) => prev.map((a, i) => (i === index ? updated : a)));
  };

  const addParty = () => {
    if (actors.length >= MAX_PARTIES) return;
    setActors((prev) => [...prev, emptyActor()]);
  };

  const removeParty = (index: number) => {
    if (index === 0) return; // can't remove primary
    setActors((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedMateria = MATERIAS.find((m) => m.key === matterArea);

  const mut = useMutation({
    mutationFn: () => {
      const validActors = actors.filter((a, i) => i === 0 || !isActorEmpty(a));
      const effectiveSubtype = caseSubtype === "otro" ? customSubtype.trim() : caseSubtype;
      const derivedCaseType = matterArea ? deriveCaseType(matterArea as MatterArea, caseSubtype) : null;
      return createCase(tenantId, {
        case_type: derivedCaseType ?? (matterArea || "unknown"),
        title: title.trim(),
        priority,
        matter_area: (matterArea as MatterArea) || undefined,
        case_subtype: effectiveSubtype || undefined,
        procedural_stage_at_intake: (proceduralStage as ProceduralStage) || undefined,
        initial_state: mode === "evaluacion" ? "EVALUACION_INICIAL" : "INGESTION",
        initial_actors: validActors.map((a) => ({
          role: a.role,
          is_primary: a.is_primary,
          actor_kind: a.actor_kind,
          full_name: a.full_name.trim(),
          identification_type: a.identification_type || undefined,
          identification_number: a.identification_number || undefined,
          email: a.email || undefined,
          phone: a.phone || undefined,
          conflict_check_done: false,
          conflict_detected: false,
        })),
      });
    },
    onSuccess: async (c) => {
      await qc.invalidateQueries({ queryKey: ["legal_cases", tenantId] });
      // Defensive: backend may fail silently inserting actors
      const actors = (c as unknown as Record<string, unknown>).actors;
      if (!actors || (Array.isArray(actors) && actors.length === 0)) {
        setActorWarning(
          "Expediente creado. Los actores se registrarán automáticamente — si no aparecen en 30 segundos, edítalos manualmente."
        );
        // Non-blocking: redirect after brief delay so user sees the warning
        setTimeout(() => router.push(`/legal/cases/${c.case_id}`), 3000);
      } else {
        router.push(`/legal/cases/${c.case_id}`);
      }
    },
  });

  const next = () => {
    setErr(null);
    if (step === 1) {
      if (!matterArea) {
        setErr((m.wizard.errors as Record<string, string>).matter_required);
        return;
      }
      if (!title.trim()) {
        setErr(m.wizard.errors.title_required);
        return;
      }
    }
    if (step === 2) {
      if (!actors[0].full_name.trim()) {
        setErr(m.wizard.errors.client_required);
        return;
      }
      // Validate additional actors: if any field is filled, full_name is required
      for (let i = 1; i < actors.length; i++) {
        const a = actors[i];
        if (!isActorEmpty(a) && !a.full_name.trim()) {
          setErr(m.wizard.errors.client_required);
          return;
        }
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const steps = [1, 2, 3] as const;

  const additionalPartyCount = actors.slice(1).filter((a) => !isActorEmpty(a)).length;

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

      {actorWarning ? (
        <p className="mt-3 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-300" role="status">
          {actorWarning}
        </p>
      ) : null}

      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          {/* Materia */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              {(m.wizard as Record<string, unknown>).matter_area_label as string}
              <select
                value={matterArea}
                onChange={(e) => {
                  setMatterArea(e.target.value as MatterArea | "");
                  setCaseSubtype("");
                  setCustomSubtype("");
                }}
                className={inputClass}
              >
                <option value="">— Seleccione —</option>
                {MATERIAS.map((mat) => (
                  <option key={mat.key} value={mat.key}>
                    {mat.label_es}
                  </option>
                ))}
              </select>
            </label>
            {selectedMateria ? (
              <span
                className={cn(
                  "mt-2 inline-block rounded-md border px-2 py-0.5 text-xs",
                  COVERAGE_BADGE[selectedMateria.coverage].className,
                )}
              >
                {COVERAGE_BADGE[selectedMateria.coverage].label}
              </span>
            ) : null}
          </div>

          {/* Sub-materia */}
          {selectedMateria ? (
            <div>
              <label className="block text-sm font-medium text-zinc-300">
                {(m.wizard as Record<string, unknown>).case_subtype_label as string}
                <select
                  value={caseSubtype}
                  onChange={(e) => {
                    setCaseSubtype(e.target.value);
                    if (e.target.value !== "otro") setCustomSubtype("");
                  }}
                  className={inputClass}
                >
                  <option value="">— Seleccione —</option>
                  {selectedMateria.subtypes.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label_es}
                    </option>
                  ))}
                </select>
              </label>
              {caseSubtype === "otro" ? (
                <input
                  value={customSubtype}
                  onChange={(e) => setCustomSubtype(e.target.value)}
                  placeholder={(m.wizard as Record<string, unknown>).custom_subtype_placeholder as string}
                  className={cn(inputClass, "mt-2")}
                />
              ) : null}
            </div>
          ) : null}

          {/* Etapa procesal */}
          <label className="block text-sm font-medium text-zinc-300">
            {(m.wizard as Record<string, unknown>).procedural_stage_label as string}
            <select
              value={proceduralStage}
              onChange={(e) => setProceduralStage(e.target.value as ProceduralStage | "")}
              className={inputClass}
            >
              <option value="">— Seleccione —</option>
              {(["first_instance", "appeal", "cassation", "enforcement", "unknown"] as const).map((ps) => (
                <option key={ps} value={ps}>
                  {((m.wizard as Record<string, unknown>).procedural_stages as Record<string, string>)[ps]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-zinc-500">
              {(m.wizard as Record<string, unknown>).procedural_stage_note as string}
            </span>
          </label>

          {/* Título */}
          <label className="block text-sm font-medium text-zinc-300">
            Título del expediente
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>

          {/* Prioridad */}
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
          className="mt-6 space-y-5"
        >
          {/* Client (primary actor) */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {m.wizard.client_section}
            </h2>
            <ActorFormCard
              actor={actors[0]}
              onChange={(a) => updateActor(0, a)}
              label={m.wizard.client_section}
              roleOptions={["cliente"]}
              messages={m}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800/40" />

          {/* Additional parties */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {m.wizard.other_parties}
            </h2>

            <div className="space-y-3">
              {actors.slice(1).map((actor, idx) => (
                <ActorFormCard
                  key={idx}
                  actor={actor}
                  onChange={(a) => updateActor(idx + 1, a)}
                  onRemove={() => removeParty(idx + 1)}
                  collapsed
                  label={m.wizard.party_label.replace("{n}", String(idx + 2))}
                  roleOptions={[...ROLE_OPTIONS]}
                  messages={m}
                />
              ))}
            </div>

            {actors.length < MAX_PARTIES ? (
              <button
                type="button"
                className="mt-3 rounded-lg px-3 py-2 text-sm text-violet-400 ring-1 ring-violet-500/30 transition-colors hover:bg-violet-950/30"
                onClick={addParty}
              >
                {m.wizard.add_party}
              </button>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">{m.wizard.max_parties}</p>
            )}
          </div>
        </motion.div>
      ) : null}

      {step === 3 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-3 text-sm text-zinc-300"
        >
          <p>{m.wizard.steps["3"]}: puedes adjuntar documentos después desde el detalle del expediente.</p>
          <ul className="list-inside list-disc text-zinc-400">
            <li>
              {selectedMateria?.label_es ?? "—"}{caseSubtype && caseSubtype !== "otro" ? ` — ${selectedMateria?.subtypes.find((s) => s.value === caseSubtype)?.label_es ?? caseSubtype}` : caseSubtype === "otro" && customSubtype.trim() ? ` — ${customSubtype.trim()}` : ""} — {title}
            </li>
            <li>
              Cliente: {actors[0].full_name || "—"} ({(m.wizard.actor_kind as Record<string, string>)[actors[0].actor_kind]})
            </li>
            {additionalPartyCount > 0 ? (
              <li>
                {m.wizard.summary_additional_parties.replace("{count}", String(additionalPartyCount))}
              </li>
            ) : null}
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
