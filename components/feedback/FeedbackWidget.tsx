"use client";

import { MessageCirclePlus } from "lucide-react";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { useFeedback } from "@/hooks/useFeedback";
import { isFeedbackEnabled } from "@/lib/feedback/feedback-api";

interface FeedbackWidgetProps {
  context?: string;
}

export function FeedbackWidget({ context }: FeedbackWidgetProps) {
  const { isOpen, open, close, submitted, submit, submitError, isSubmitting } = useFeedback();

  if (!isFeedbackEnabled()) {
    return null;
  }

  const ctx = context ?? "floating-widget";

  return (
    <>
      <FeedbackModal
        open={isOpen}
        onClose={close}
        isSubmitting={isSubmitting}
        submitted={submitted}
        submitError={submitError}
        title="¿Cómo vamos?"
        context={ctx}
        onSubmit={(rating, comment, anon) =>
          void submit(rating, comment, ctx, anon)
        }
      />
      <div className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-[139] md:bottom-10 md:right-10">
        <button
          type="button"
          aria-label="Abrir encuesta rápida de feedback"
          className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white shadow-lg shadow-purple-950/55 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200"
          data-testid="feedback-widget-launcher"
          onClick={() => open()}
        >
          <MessageCirclePlus className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </>
  );
}
