"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

interface SelfieCaptureProps {
  onCapture: (dataUrl: string | null) => void;
  captured: string | null;
}

export function SelfieCapture({ onCapture, captured }: SelfieCaptureProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setStreaming(false);
  };

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      const el = videoRef.current;
      if (el) {
        el.srcObject = s;
        await el.play().catch(() => {});
      }
      setStreaming(true);
    } catch {
      setError(t.consent.public.selfie_camera_blocked);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth < 2) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
    };
  }, [stream]);

  return (
    <section className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4" aria-labelledby="selfie-heading">
      <h3 id="selfie-heading" className="text-lg font-semibold text-white">
        {t.consent.public.selfie_section_title}
      </h3>
      <p className="text-sm text-slate-300">{t.consent.public.selfie_explanation}</p>

      {!captured && !streaming && (
        <button
          type="button"
          onClick={() => void startCamera()}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          data-testid="selfie-start"
        >
          {t.consent.public.selfie_take}
        </button>
      )}

      {streaming && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="mx-auto aspect-square w-full max-w-sm rounded-lg bg-slate-900 object-cover"
          />
          <button
            type="button"
            onClick={captureFrame}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            data-testid="selfie-capture"
          >
            {t.consent.public.selfie_take}
          </button>
        </div>
      )}

      {captured && (
        <div className="space-y-3">
          <img
            src={captured}
            alt={t.consent.public.selfie_preview_alt}
            className="mx-auto w-full max-w-sm rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => onCapture(null)}
            className="w-full rounded-lg bg-slate-700 px-4 py-3 text-sm text-white hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            data-testid="selfie-retake"
          >
            {t.consent.public.selfie_retake}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
