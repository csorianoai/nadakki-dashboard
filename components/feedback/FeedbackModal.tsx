"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { FeedbackThankYou } from "@/components/feedback/FeedbackThankYou";
import { RatingStars } from "@/components/feedback/RatingStars";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  submitted: boolean;
  submitError?: string | null;
  /** Fire-and-forget submit; hook already tracks submitting / submitted flags */
  onSubmit: (rating: number, comment: string | undefined, isAnonymous?: boolean) => void | Promise<void>;
  title?: string;
  context?: string;
}

export function FeedbackModal({
  open,
  onClose,
  isSubmitting,
  submitted,
  submitError,
  onSubmit,
  title = "Cuéntanos tu experiencia",
  context = "floating-widget",
}: FeedbackModalProps) {
  const headingId = useId();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    if (!open) {
      setRating(5);
      setComment("");
      setAnonymous(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140]" role="presentation">
      <button
        type="button"
        aria-label="Cerrar superficie modal de feedback"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        disabled={isSubmitting}
        onClick={onClose}
        data-testid="feedback-modal-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-[141] mx-auto flex max-h-[90vh] w-[min(100%,480px)] flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-[#090b17] px-4 py-5 text-white shadow-2xl sm:mt-[6vh]"
        data-testid="feedback-modal"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/95">Retroalimentación</p>
            <h2 id={headingId} className="text-xl font-semibold">
              {title}
            </h2>
            <p className="sr-only">Contexto {context}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md border border-white/15 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="feedback-modal-close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {!submitted ? (
          <>
            <RatingStars value={rating} onChange={setRating} disabled={isSubmitting} />
            <label className="text-sm text-gray-300" htmlFor="feedback-comment">
              Comentario (opcional)
            </label>
            <textarea
              id="feedback-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-fuchsia-400 focus:outline-none"
              placeholder="¿Qué podemos conservar o mejorar?"
              data-testid="feedback-comment"
            />

            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                disabled={isSubmitting}
                data-testid="feedback-anonymous"
              />
              Enviar de forma anónima
            </label>

            {submitError ? (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${submitError.includes("429") ? "border-orange-400/60 bg-orange-950/65 text-orange-50" : "border-red-400/55 bg-red-950/65 text-red-50"}`}
                role="alert"
                data-testid="feedback-submit-error"
              >
                {submitError.includes("429")
                  ? "Demasiadas solicitudes. Intenta de nuevo en unos minutos."
                  : submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-[44px] rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                disabled={isSubmitting}
                data-testid="feedback-submit"
                onClick={() => void onSubmit(rating, comment.trim() || undefined, anonymous)}
              >
                {isSubmitting ? "Enviando…" : "Enviar feedback"}
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-200"
                disabled={isSubmitting}
                onClick={onClose}
                data-testid="feedback-cancel"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <FeedbackThankYou headline="¡Recibimos tu feedback!" />
            <button
              type="button"
              className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-100"
              onClick={onClose}
              data-testid="feedback-thank-dismiss"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
