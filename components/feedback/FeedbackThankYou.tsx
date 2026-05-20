"use client";

interface FeedbackThankYouProps {
  headline?: string;
  message?: string;
}

export function FeedbackThankYou({
  headline = "¡Gracias!",
  message = "Tu opinión mejora el producto NADAKKI para todo el equipo.",
}: FeedbackThankYouProps) {
  return (
    <div
      className="rounded-2xl border border-emerald-500/35 bg-emerald-950/50 p-6 text-center text-emerald-50"
      data-testid="feedback-thank-you"
      role="status"
      aria-live="polite"
    >
      <p className="text-xl font-semibold">{headline}</p>
      <p className="mt-3 text-sm text-emerald-100/95">{message}</p>
    </div>
  );
}
