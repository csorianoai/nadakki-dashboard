"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  Circle,
  GitBranch,
  Link2,
  Megaphone,
  PartyPopper,
  Sparkles,
  Target,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import {
  GOAL_OPTIONS,
  MARKETING_ONBOARDING_STEPS,
  WORKFLOW_SAMPLES,
} from "@/lib/marketing/onboarding/content";
import {
  firstIncompleteStepIndex,
  loadMarketingOnboardingState,
  percentComplete,
  saveMarketingOnboardingState,
  scheduleMarketingOnboardingBackendSync,
} from "@/lib/marketing/onboarding/persistence";
import {
  MARKETING_ONBOARDING_STEP_ORDER,
  type MarketingOnboardingStepId,
} from "@/lib/marketing/onboarding/types";
import { useTenant } from "@/contexts/TenantContext";

const STEP_ICONS: Record<MarketingOnboardingStepId, typeof Sparkles> = {
  welcome: Sparkles,
  connect: Link2,
  goals: Target,
  campaign: Megaphone,
  agents: Bot,
  workflow: GitBranch,
  notifications: Bell,
  done: PartyPopper,
};

function StepIcon({ id, active }: { id: MarketingOnboardingStepId; active: boolean }) {
  const Icon = STEP_ICONS[id];
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors ${
        active
          ? "border-pink-500 bg-pink-500/15 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)]"
          : "border-white/15 bg-white/5 text-gray-400"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </div>
  );
}

export function OnboardingWizard() {
  const { tenantId } = useTenant();
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<MarketingOnboardingStepId[]>([]);
  const [goalKeys, setGoalKeys] = useState<string[]>([]);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySlack, setNotifySlack] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [agentDemoId, setAgentDemoId] = useState<string | null>("strategist");
  const [workflowPick, setWorkflowPick] = useState<string>(WORKFLOW_SAMPLES[0]?.id ?? "win");
  const [connectChecked, setConnectChecked] = useState<Record<string, boolean>>({
    google: false,
    meta: false,
    linkedin: false,
    tiktok: false,
  });
  const [celebrate, setCelebrate] = useState(false);

  const persist = useCallback(
    (patch: Partial<{
      currentStepIndex: number;
      completedStepIds: MarketingOnboardingStepId[];
      goalKeys: string[];
      notifyEmail: boolean;
      notifySlack: boolean;
      notifyInApp: boolean;
    }>) => {
      const base = loadMarketingOnboardingState(tenantId);
      const next = {
        ...base,
        ...patch,
        goalKeys: patch.goalKeys ?? base.goalKeys ?? [],
        notifyEmail: patch.notifyEmail ?? base.notifyEmail ?? true,
        notifySlack: patch.notifySlack ?? base.notifySlack ?? false,
        notifyInApp: patch.notifyInApp ?? base.notifyInApp ?? true,
        completedStepIds: patch.completedStepIds ?? base.completedStepIds ?? [],
        currentStepIndex: patch.currentStepIndex ?? base.currentStepIndex ?? 0,
        updatedAt: new Date().toISOString(),
      };
      saveMarketingOnboardingState(tenantId, next);
      scheduleMarketingOnboardingBackendSync(tenantId, next);
    },
    [tenantId]
  );

  useEffect(() => {
    setMounted(true);
    const s = loadMarketingOnboardingState(tenantId);
    const done = new Set(s.completedStepIds);
    const resume =
      s.completedStepIds.length >= MARKETING_ONBOARDING_STEP_ORDER.length
        ? MARKETING_ONBOARDING_STEP_ORDER.length - 1
        : firstIncompleteStepIndex(s.completedStepIds);
    setCompleted(s.completedStepIds);
    setStepIndex(resume);
    setGoalKeys(s.goalKeys ?? []);
    setNotifyEmail(s.notifyEmail ?? true);
    setNotifySlack(s.notifySlack ?? false);
    setNotifyInApp(s.notifyInApp ?? true);
    if (done.has("done")) setCelebrate(true);
  }, [tenantId]);

  const step = MARKETING_ONBOARDING_STEPS[stepIndex] ?? MARKETING_ONBOARDING_STEPS[0];
  const pct = useMemo(() => percentComplete(completed), [completed]);
  const stepId = MARKETING_ONBOARDING_STEP_ORDER[stepIndex];

  const markStepComplete = (id: MarketingOnboardingStepId) => {
    setCompleted((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persist({ completedStepIds: next, currentStepIndex: stepIndex });
      if (id === "done") {
        setCelebrate(true);
      }
      return next;
    });
  };

  const goNext = () => {
    setStepIndex((i) => {
      const ni = Math.min(i + 1, MARKETING_ONBOARDING_STEPS.length - 1);
      persist({ currentStepIndex: ni });
      return ni;
    });
  };

  const goPrev = () => {
    setStepIndex((i) => {
      const ni = Math.max(i - 1, 0);
      persist({ currentStepIndex: ni });
      return ni;
    });
  };

  const selectStep = (idx: number) => {
    setStepIndex(idx);
    persist({ currentStepIndex: idx });
  };

  const isComplete = (id: MarketingOnboardingStepId) => completed.includes(id);

  const toggleGoal = (key: string) => {
    setGoalKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      persist({ goalKeys: next });
      return next;
    });
  };

  const onNotifChange = (key: "notifyEmail" | "notifySlack" | "notifyInApp", value: boolean) => {
    if (key === "notifyEmail") {
      setNotifyEmail(value);
      persist({ notifyEmail: value });
    }
    if (key === "notifySlack") {
      setNotifySlack(value);
      persist({ notifySlack: value });
    }
    if (key === "notifyInApp") {
      setNotifyInApp(value);
      persist({ notifyInApp: value });
    }
  };

  if (!mounted) {
    return (
      <GlassCard className="p-8 border border-white/10">
        <p className="text-gray-400 m-0">Cargando asistente…</p>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="lg:w-80 shrink-0 space-y-4">
        <GlassCard className="p-4 border border-pink-500/25">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-400 m-0 mb-3">Progreso</p>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{pct}%</span>
            <span className="text-xs text-gray-500">
              {completed.length}/{MARKETING_ONBOARDING_STEP_ORDER.length} pasos
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {!tenantId && (
            <p className="text-xs text-amber-200/90 mt-3 m-0">
              Selecciona un tenant para sincronizar el progreso con la suite (localStorage sigue activo).
            </p>
          )}
        </GlassCard>

        <nav aria-label="Pasos del onboarding" className="space-y-1">
          {MARKETING_ONBOARDING_STEPS.map((s, idx) => {
            const done = isComplete(s.id);
            const active = idx === stepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectStep(idx)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-pink-500/10 ring-1 ring-pink-500/40" : "hover:bg-white/5"
                }`}
              >
                <span className="text-pink-500/80" aria-hidden>
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 opacity-40" />}
                </span>
                <StepIcon id={s.id} active={active} />
                <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-300"}`}>
                  {s.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        {completed.length === 0 && stepIndex === 0 && (
          <GlassCard className="p-4 border border-cyan-500/20 bg-cyan-500/5">
            <p className="text-sm text-cyan-100 m-0">
              <strong className="text-white">Primer uso:</strong> completa los pasos en orden o salta desde el menú
              lateral. Tu avance se guarda en este navegador; con tenant activo reintentamos guardar en backend (cuando el
              endpoint exista).
            </p>
          </GlassCard>
        )}

        <GlassCard
          className={`relative overflow-hidden p-6 md:p-8 border border-white/10 ${
            celebrate && stepId === "done" ? "ring-2 ring-pink-500/60 shadow-[0_0_40px_rgba(236,72,153,0.2)]" : ""
          }`}
        >
          {celebrate && stepId === "done" && (
            <div
              className="pointer-events-none absolute inset-0 flex items-start justify-center animate-marketing-celebrate"
              aria-hidden
            >
              <span className="mt-4 text-4xl select-none">✨</span>
            </div>
          )}

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <StepIcon id={stepId} active />
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-400 m-0 mb-1">
                  Paso {stepIndex + 1} de {MARKETING_ONBOARDING_STEPS.length}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white m-0">{step.title}</h2>
                <p className="text-pink-200/90 font-medium mt-2 m-0">{step.summary}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500 m-0 mb-2">{step.diagramCaption}</p>
                <div className="flex flex-wrap gap-2">
                  {MARKETING_ONBOARDING_STEP_ORDER.slice(0, 6).map((id) => (
                    <span
                      key={id}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                        id === stepId ? "bg-pink-500/20 text-pink-200" : "bg-white/5 text-gray-400"
                      }`}
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                {step.body.map((p, i) => (
                  <p key={i} className="m-0">
                    {p}
                  </p>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white m-0 mb-2">Pasos sugeridos</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300 m-0">
                  {step.instructions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-emerald-300 m-0 mb-1">Pro tip</p>
                  <p className="text-sm text-emerald-100/90 m-0">{step.proTip}</p>
                </div>
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
                  <p className="text-xs font-semibold text-rose-300 m-0 mb-1">Evita estos errores</p>
                  <ul className="text-sm text-rose-100/90 m-0 pl-4 list-disc space-y-1">
                    {step.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <p className="text-xs font-semibold text-indigo-300 m-0 mb-1">Caso: Nadakki Excursions</p>
                  <p className="text-sm text-indigo-100/90 m-0">{step.useCaseNadakki}</p>
                </div>
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-xs font-semibold text-violet-300 m-0 mb-1">Caso: CrediCefi</p>
                  <p className="text-sm text-violet-100/90 m-0">{step.useCaseCredicefi}</p>
                </div>
              </div>

              {stepId === "connect" && (
                <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white m-0">Checklist de conectores</p>
                  {[
                    { key: "google", label: "Google Ads / Google Marketing Platform" },
                    { key: "meta", label: "Meta (Facebook / Instagram)" },
                    { key: "linkedin", label: "LinkedIn Ads" },
                    { key: "tiktok", label: "TikTok for Business" },
                  ].map((row) => (
                    <label key={row.key} className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={connectChecked[row.key] ?? false}
                        onChange={(e) => setConnectChecked((p) => ({ ...p, [row.key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 accent-pink-500"
                      />
                      {row.label}
                    </label>
                  ))}
                  <Link
                    href="/marketing/social-connections"
                    className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500 transition-colors"
                  >
                    Abrir conexiones <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {stepId === "goals" && (
                <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 space-y-2">
                  <p className="text-sm font-semibold text-white m-0">Selecciona objetivos (puedes marcar varios)</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        type="button"
                        key={g.key}
                        onClick={() => toggleGoal(g.key)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                          goalKeys.includes(g.key)
                            ? "border-pink-400 bg-pink-500/20 text-pink-100"
                            : "border-white/15 bg-white/5 text-gray-300 hover:border-pink-500/40"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stepId === "campaign" && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white m-0">Checklist de primera campaña</p>
                  <ul className="text-sm text-amber-100/90 m-0 pl-4 list-disc space-y-1">
                    <li>Objetivo alineado con el paso anterior</li>
                    <li>Presupuesto de aprendizaje (7 días)</li>
                    <li>Medición activa antes de publicar</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/marketing/campaigns/new"
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-400"
                    >
                      Nueva campaña (Marketing)
                    </Link>
                    <Link
                      href="/marketing/run"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/5"
                    >
                      Command center
                    </Link>
                  </div>
                </div>
              )}

              {stepId === "agents" && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white m-0">Demo rápida: roles de agentes</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "strategist", label: "Estrategia de campaña" },
                      { id: "creative", label: "Creatividad / RSA" },
                      { id: "ops", label: "Operación y pacing" },
                    ].map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setAgentDemoId(a.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                          agentDemoId === a.id
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                            : "border-white/10 bg-white/5 text-gray-300"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-cyan-50/90 m-0">
                    {agentDemoId === "strategist" &&
                      "Propone estructuras de campaña, tipos de puja y expansiones acotadas a tu industria."}
                    {agentDemoId === "creative" &&
                      "Genera variantes de anuncio y sugerencias RSA respetando límites de caracteres."}
                    {agentDemoId === "ops" &&
                      "Monitorea ritmo de gasto, picos anómalos y fatiga creativa con alertas accionables."}
                  </p>
                  <Link
                    href="/marketing/agents"
                    className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                  >
                    Abrir catálogo de agentes
                  </Link>
                </div>
              )}

              {stepId === "workflow" && (
                <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white m-0">Elige una plantilla de ejemplo</p>
                  <div className="space-y-2">
                    {WORKFLOW_SAMPLES.map((w) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setWorkflowPick(w.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          workflowPick === w.id
                            ? "border-lime-400 bg-lime-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-lime-500/30"
                        }`}
                      >
                        <span className="font-semibold block">{w.title}</span>
                        <span className="text-xs text-gray-400">{w.description}</span>
                      </button>
                    ))}
                  </div>
                  <Link href="/workflows" className="text-xs font-semibold text-lime-300 hover:text-lime-200 underline">
                    Ver workflows completos
                  </Link>
                </div>
              )}

              {stepId === "notifications" && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white m-0">Preferencias (demo — se guarda localmente)</p>
                  {[
                    { key: "notifyEmail" as const, label: "Correo crítico", checked: notifyEmail },
                    { key: "notifySlack" as const, label: "Slack / chat (si está integrado)", checked: notifySlack },
                    { key: "notifyInApp" as const, label: "Notificaciones in-app", checked: notifyInApp },
                  ].map((row) => (
                    <label key={row.key} className="flex items-center justify-between gap-3 text-sm text-gray-200">
                      <span>{row.label}</span>
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) => onNotifChange(row.key, e.target.checked)}
                        className="h-4 w-4 accent-pink-500"
                      />
                    </label>
                  ))}
                  <Link href="/settings" className="text-xs font-semibold text-sky-300 hover:text-sky-200 underline">
                    Ajustes de cuenta
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={goPrev}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 disabled:opacity-40 hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <button
                  type="button"
                  disabled={stepIndex >= MARKETING_ONBOARDING_STEPS.length - 1}
                  onClick={goNext}
                  className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500 disabled:opacity-40"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => markStepComplete(stepId)}
                  className="inline-flex items-center gap-2 rounded-lg border border-pink-500/50 bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-100 hover:bg-pink-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isComplete(stepId) ? "Paso completado" : "Marcar paso como completo"}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
