"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceOverlay } from "@/components/voice/VoiceOverlayContext";
import { buildVoiceSearchHref } from "@/lib/voice-search";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const WAVE_DELAYS = [0, 0.1, 0.2, 0.3, 0.4] as const;

export function VoiceOverlay() {
  const router = useRouter();
  const { isOpen, close, transcription, setTranscription } = useVoiceOverlay();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "es-DO";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i]![0]!.transcript;
      }
      setTranscription(text.trim());
    };

    recognition.onend = () => {
      setListening(false);
      setProcessing(true);
      window.setTimeout(() => setProcessing(false), 600);
    };

    recognition.onerror = () => {
      setListening(false);
      setProcessing(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    setProcessing(false);
    recognition.start();
  }, [setTranscription]);

  useEffect(() => {
    if (!isOpen) {
      stopRecognition();
      setProcessing(false);
      return;
    }

    setSupported(getSpeechRecognition() != null);
    const timer = window.setTimeout(() => startRecognition(), 200);
    return () => {
      window.clearTimeout(timer);
      stopRecognition();
    };
  }, [isOpen, startRecognition, stopRecognition]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const statusLabel = processing ? "Procesando..." : "Escuchando...";

  const confirm = () => {
    if (!transcription.trim()) return;
    const href = buildVoiceSearchHref(transcription);
    close();
    router.push(href);
  };

  return (
    <div
      className="voice-overlay fixed inset-0 z-[9997] flex flex-col items-center justify-center bg-[rgba(8,12,22,.85)] px-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-overlay-title"
      aria-describedby="voice-overlay-desc"
    >
      {!supported ? (
        <div className="max-w-md text-center">
          <p id="voice-overlay-title" className="font-manrope text-xl font-bold text-nk-fg">
            Tu navegador no soporta búsqueda por voz
          </p>
          <p id="voice-overlay-desc" className="mt-2 text-sm text-nk-fg-muted">
            Usa el teclado para escribir tu búsqueda.
          </p>
          <Button variant="brand" className="mt-6 w-full" onClick={close}>
            Cerrar y escribir búsqueda
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-nk-lg animate-nkPulse"
            style={{ animationDuration: "1.5s" }}
            aria-label="Micrófono activo"
          >
            <Mic className="h-10 w-10" aria-hidden />
          </button>

          <div className="mt-8 flex h-8 items-end justify-center gap-1.5" aria-hidden>
            {WAVE_DELAYS.map((delay, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-brand animate-nkWave"
                style={{ animationDelay: `${delay}s`, height: 8 }}
              />
            ))}
          </div>

          <p id="voice-overlay-title" className="mt-6 text-lg text-nk-fg-muted" aria-live="polite">
            {statusLabel}
          </p>

          {transcription ? (
            <p
              className="mt-4 max-w-xl text-center font-manrope text-[28px] font-bold leading-snug text-nk-fg"
              aria-live="polite"
            >
              {transcription}
            </p>
          ) : (
            <p id="voice-overlay-desc" className="sr-only">
              Di qué vehículo buscas en español dominicano
            </p>
          )}

          <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
            {transcription.trim() ? (
              <Button variant="brand" className="min-h-11 w-full" onClick={confirm}>
                Confirmar y buscar
              </Button>
            ) : null}
            <Button variant="ghost" className="min-h-11 w-full" onClick={close}>
              Cancelar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
