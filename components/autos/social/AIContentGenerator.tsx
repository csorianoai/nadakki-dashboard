"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import type { GeneratedContent, PostType, PostTone, SocialPlatform } from "@/types/social-ai";

interface Props {
  onGenerate: (params: {
    post_type: PostType;
    tone: PostTone;
    platforms: SocialPlatform[];
    context_notes?: string;
    vehicle_id?: string;
  }) => Promise<GeneratedContent>;
  vehicleId?: string;
  isMock: boolean;
}

const TONES: { value: PostTone; label: string }[] = [
  { value: "professional", label: "Profesional" },
  { value: "casual", label: "Casual" },
  { value: "urgent", label: "Urgente" },
];

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "feed", label: "Feed" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "short", label: "Short" },
];

const ALL_PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "tiktok", "youtube"];

export default function AIContentGenerator({ onGenerate, vehicleId, isMock }: Props) {
  const [tone, setTone] = useState<PostTone>("professional");
  const [postType, setPostType] = useState<PostType>("feed");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(["facebook", "instagram"]);
  const [contextNotes, setContextNotes] = useState("");
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function togglePlatform(p: SocialPlatform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleGenerate() {
    if (platforms.length === 0) return;
    setLoading(true);
    try {
      const content = await onGenerate({
        post_type: postType,
        tone,
        platforms,
        context_notes: contextNotes || undefined,
        vehicle_id: vehicleId,
      });
      setResult(content);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = `${result.copy}\n\n${result.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Generador de Contenido AI</h2>
        {isMock && (
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
            MODO DEMO
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tono</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as PostTone)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tipo de post</label>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value as PostType)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
          >
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Platform toggles */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Plataformas</label>
        <div className="flex gap-2 flex-wrap">
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
                platforms.includes(p)
                  ? "bg-violet-500/30 border-violet-400 text-violet-200"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notas adicionales (opcional)</label>
        <textarea
          value={contextNotes}
          onChange={(e) => setContextNotes(e.target.value)}
          rows={2}
          placeholder="Ej: Destacar el bajo kilometraje, financiamiento disponible..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-400 resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || platforms.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Generando..." : "Generar contenido"}
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Contenido generado</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-sm text-white leading-relaxed">{result.copy}</p>
          <div className="flex flex-wrap gap-1">
            {result.hashtags.map((h) => (
              <span key={h} className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {h}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500">CTA: {result.cta}</p>
          <p className="text-xs text-gray-600">Modelo: {result.ai_model}</p>
        </div>
      )}
    </div>
  );
}
