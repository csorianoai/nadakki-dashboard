"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { FeedbackThankYou } from "@/components/feedback/FeedbackThankYou";
import { NPSScoreSelector } from "@/components/feedback/NPSScoreSelector";
import { useFeedback } from "@/hooks/useFeedback";
import { isFeedbackEnabled } from "@/lib/feedback/feedback-api";

function followPrompt(score: number): string {
  if (score >= 9 && score <= 10) return "¿Qué es lo que más te gustó de Nadakki?";
  if (score >= 7 && score <= 8) return "¿Qué podríamos mejorar para llegar al 10?";
  return "Cuéntanos qué salió mal — lo revisaremos con el equipo.";
}

interface NPSPromptProps {
  /** Opens automatically once on mount when cooldown + flag allow it */
  autoOffer?: boolean;
}

export function NPSPrompt({ autoOffer = false }: NPSPromptProps) {
  const { isOpen, open, close, submitted, submit, submitError, isSubmitting, shouldShowNPS, markNPSShown } =
    useFeedback();
  const headingId = useId();
  const [score, setScore] = useState<number | null>(null);
  const [detail, setDetail] = useState("");
  const detailLabel = useMemo(() => (score == null ? "" : followPrompt(score)), [score]);
  const autoFired = useRef(false);

  useEffect(() => {
    if (!isFeedbackEnabled() || !autoOffer || autoFired.current) return;
    if (!shouldShowNPS()) return;
    autoFired.current = true;
    open();
  }, [autoOffer, open, shouldShowNPS]);

  useEffect(() => {
    if (!isOpen) {
      setScore(null);
      setDetail("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (submitted) {
      markNPSShown();
    }
  }, [submitted, markNPSShown]);

  function handleDefer() {
    markNPSShown();
    close();
  }

  if (!isFeedbackEnabled()) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[160]" role="presentation" data-testid="nps-prompt-root">
      <button
        type="button"
        aria-label="Cerrar encuesta Net Promoter"
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleDefer}
        data-testid="nps-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-[161] mx-auto flex max-h-[92vh] w-[min(100%,520px)] flex-col gap-4 overflow-y-auto rounded-3xl border border-purple-400/35 bg-[#090515] px-4 py-6 text-white shadow-2xl sm:mt-[10vh]"
        data-testid="nps-modal"
      >
        <header className="flex gap-3">
          <div className="rounded-2xl border border-purple-400/40 bg-purple-900/35 p-2">
            <Sparkles className="h-8 w-8 text-purple-100" aria-hidden />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-purple-100/95">Research · NPS</p>
            <h2 id={headingId} className="mt-2 text-xl font-semibold tracking-tight">
              ¿Qué probabilidad tienes de recomendar Nadakki?
            </h2>
            <p className="sr-only">Escala 0 muy poco probable, 10 muy probable</p>
          </div>
        </header>

        {!submitted ? (
          <>
            <NPSScoreSelector value={score} onChange={setScore} disabled={isSubmitting} />

            <div className="space-y-2">
              <label className="text-sm text-gray-200" htmlFor="nps-detail">
                {score == null ? "Selecciona una puntuación para continuar" : detailLabel}
              </label>
              <textarea
                id="nps-detail"
                rows={4}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                disabled={isSubmitting || score == null}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-400 focus:outline-none"
                placeholder={
                  score == null ? "" : score >= 9 ? "Resalta tus momentos favoritos" : "Sé específico, sin datos personales"
                }
                data-testid="nps-detail"
              />
            </div>

            {submitError ? (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${submitError.includes("429") ? "border-orange-400/60 bg-orange-950/65 text-orange-50" : "border-red-400/55 bg-red-950/65 text-red-50"}`}
                role="alert"
                data-testid="nps-submit-error"
              >
                {submitError.includes("429")
                  ? "Alcanzaste el límite temporal de envíos. Intenta dentro de breve."
                  : submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-[46px] flex-1 rounded-xl bg-purple-600 px-4 py-2 text-center text-sm font-semibold disabled:opacity-40"
                data-testid="nps-submit"
                disabled={isSubmitting || score == null}
                onClick={() => {
                  if (score == null) return;
                  void submit(score, detail.trim() || undefined, "nps-survey", false);
                }}
              >
                {isSubmitting ? "Guardando respuesta…" : "Compartir opinión"}
              </button>
              <button
                type="button"
                className="min-h-[46px] flex-1 rounded-xl border border-white/20 px-4 py-2 text-sm disabled:opacity-40"
                onClick={handleDefer}
                disabled={isSubmitting}
                data-testid="nps-defer"
              >
                Quizás después (30&nbsp;días)
              </button>
            </div>
          </>
        ) : (
          <>
            <FeedbackThankYou
              headline="¡Gracias por tu NPS!"
              message="Valoramos tus comentarios; impulsamos el roadmap con estos datos sintetizados."
            />
            <button
              type="button"
              className="min-h-[46px] rounded-xl border border-white/20 px-4 py-2 text-sm font-medium"
              onClick={close}
              data-testid="nps-thank-dismiss"
            >
              Listo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
