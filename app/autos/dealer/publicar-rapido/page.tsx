"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AIAnalysisProgress } from "@/components/dealer/AIAnalysisProgress";
import { GeneratedListingPreview } from "@/components/dealer/GeneratedListingPreview";
import { PhotoUploader } from "@/components/dealer/PhotoUploader";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { confirmPublish, publishFromPhotos } from "@/lib/api/dealer-publish";
import type { GeneratedListing, PublishResult } from "@/lib/dealer/publish-mock";

type FlowState = "upload" | "analyzing" | "preview" | "success";

export default function PublicarRapidoPage() {
  const [state, setState] = useState<FlowState>("upload");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const startTime = useRef<number>(0);

  const handlePhotos = useCallback((files: File[]) => {
    setPhotos(files);
    if (files[0]) setPhotoUrl(URL.createObjectURL(files[0]));
  }, []);

  const startAnalysis = async () => {
    if (photos.length < 5) return;
    startTime.current = Date.now();
    setState("analyzing");
  };

  const onAnalysisComplete = async () => {
    const res = await publishFromPhotos(photos);
    setListing(res.data);
    setDemoMode(!res.fromBackend);
    if (!res.fromBackend) toast.message("Modo demo — conectar backend para uso real");
    setState("preview");
  };

  const handlePublish = async () => {
    if (!listing) return;
    setPublishing(true);
    try {
      const res = await confirmPublish(listing.listingId, listing);
      setResult(res.data);
      setDemoMode(!res.fromBackend);
      setState("success");
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      toast.success("¡Publicado con éxito!");
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setState("upload");
    setPhotos([]);
    setPhotoUrl(undefined);
    setListing(null);
    setResult(null);
  };

  const elapsed =
    result?.elapsedSeconds ??
    Math.round((Date.now() - (startTime.current || Date.now())) / 1000);

  return (
    <main className="pb-12">
      <header className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">
            Publica en 90 segundos con AI
          </h1>
          <p className="mt-1 text-nk-fg-muted">Sube 5 fotos, Nadakki AI hace el resto</p>
        </div>
        <DemoModeBadge visible={demoMode} />
      </header>

      {state === "upload" ? (
        <>
          <PhotoUploader maxPhotos={5} onPhotosSelected={handlePhotos} />
          <button
            type="button"
            disabled={photos.length < 5}
            onClick={startAnalysis}
            className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-2 to-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Analizar con AI
          </button>
        </>
      ) : null}

      {state === "analyzing" ? (
        <AIAnalysisProgress photoUrl={photoUrl} active onComplete={onAnalysisComplete} />
      ) : null}

      {state === "preview" && listing ? (
        <>
          <GeneratedListingPreview
            listing={listing}
            onChange={(patch) => setListing((l) => (l ? { ...l, ...patch } : l))}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-2 to-brand px-8 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar ahora
            </button>
            <Link
              href="/autos/dealer"
              className="inline-flex min-h-11 items-center rounded-full border border-nk-border px-6 py-3 text-sm font-semibold text-nk-fg-muted"
            >
              Ajustar detalles (wizard completo)
            </Link>
          </div>
        </>
      ) : null}

      {state === "success" && result ? (
        <div className="mx-auto max-w-md text-center">
          <p className="text-4xl">✅</p>
          <h2 className="mt-4 font-manrope text-2xl font-extrabold text-nk-fg">
            Publicado con éxito
          </h2>
          <p className="mt-2 text-nk-fg-muted">Tiempo total: {elapsed} segundos</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/autos/vehiculo/${result.vehicleId}`}
              className="rounded-full bg-gradient-to-r from-brand-2 to-brand px-6 py-3 text-sm font-bold text-white"
            >
              Ver mi publicación
            </Link>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-nk-border px-6 py-3 text-sm font-semibold text-nk-fg"
            >
              Publicar otro vehículo
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
