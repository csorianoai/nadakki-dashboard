"use client";

import { useState } from "react";
import { TIKTOK_MAX_VIDEO_BYTES, uploadTikTokDraft } from "@/lib/api/marketing";

const TIPOS_PERMITIDOS = ["video/mp4", "video/quicktime"];

/** Valida el archivo antes de subirlo. Devuelve un mensaje en español o null si es válido. */
export function validateTikTokVideo(file: { type: string; size: number }): string | null {
  if (!TIPOS_PERMITIDOS.includes(file.type)) return "Solo se aceptan archivos MP4 o MOV.";
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > TIKTOK_MAX_VIDEO_BYTES) return "El video supera el límite de 50 MB.";
  return null;
}

type Estado =
  | { tipo: "vacio" }
  | { tipo: "listo"; nombre: string }
  | { tipo: "subiendo"; nombre: string }
  | { tipo: "ok"; publishId: string }
  | { tipo: "error"; mensaje: string };

export default function TikTokDraftUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "vacio" });

  const onElegir = (f: File | null) => {
    setFile(f);
    if (!f) return setEstado({ tipo: "vacio" });
    const error = validateTikTokVideo(f);
    setEstado(error ? { tipo: "error", mensaje: error } : { tipo: "listo", nombre: f.name });
  };

  const onEnviar = async () => {
    if (!file) return;
    setEstado({ tipo: "subiendo", nombre: file.name });
    const r = await uploadTikTokDraft(file);
    if ("publishId" in r) {
      setEstado({ tipo: "ok", publishId: r.publishId });
    } else {
      setEstado({ tipo: "error", mensaje: r.error });
    }
  };

  const puedeEnviar = estado.tipo === "listo";

  return (
    <section aria-labelledby="tiktok-draft-title" className="mt-8 rounded-xl border border-white/10 p-6">
      <h2 id="tiktok-draft-title" className="text-lg font-semibold text-white">
        Enviar video a TikTok como borrador
      </h2>
      <p className="mt-1 text-sm text-gray-400">
        El video llega a tu bandeja de borradores de TikTok. No se publica en vivo: lo revisas y publicas desde TikTok.
      </p>

      <label className="mt-4 block text-sm text-gray-300" htmlFor="tiktok-video-input">
        Video (MP4 o MOV, máximo 50 MB)
      </label>
      <input
        id="tiktok-video-input"
        type="file"
        accept="video/mp4,video/quicktime"
        className="mt-2 block text-sm text-gray-300"
        onChange={(e) => onElegir(e.target.files?.[0] ?? null)}
        disabled={estado.tipo === "subiendo"}
      />

      <button
        type="button"
        onClick={() => void onEnviar()}
        disabled={!puedeEnviar}
        className="mt-4 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {estado.tipo === "subiendo" ? "Enviando…" : "Enviar borrador"}
      </button>

      <div role="status" aria-live="polite" className="mt-3 text-sm">
        {estado.tipo === "listo" && <span className="text-gray-300">Listo para enviar: {estado.nombre}</span>}
        {estado.tipo === "subiendo" && <span className="text-gray-300">Subiendo {estado.nombre}…</span>}
        {estado.tipo === "ok" && (
          <span className="text-emerald-300">
            Borrador creado en TikTok. Revísalo en tu bandeja de borradores. (ID: {estado.publishId})
          </span>
        )}
        {estado.tipo === "error" && <span className="text-red-300">{estado.mensaje}</span>}
      </div>
    </section>
  );
}
