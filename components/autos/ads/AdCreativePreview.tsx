"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import type { AdCreatives } from "@/types/ads-ai";

interface Props {
  creatives: AdCreatives;
  vehicleId?: string;
  objective: string;
  platforms: string[];
  isMock: boolean;
}

export default function AdCreativePreview({ creatives, vehicleId, objective, platforms, isMock }: Props) {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [copyIdx, setCopyIdx] = useState(0);

  const headlines = creatives.headlines ?? [];
  const copies = creatives.body_copies ?? [];

  function prev(arr: unknown[], idx: number, setIdx: (n: number) => void) {
    setIdx((idx - 1 + arr.length) % arr.length);
  }
  function next(arr: unknown[], idx: number, setIdx: (n: number) => void) {
    setIdx((idx + 1) % arr.length);
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-orange-400" />
        <h2 className="text-lg font-semibold text-white">Vista Previa de Anuncios</h2>
        {isMock && (
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
            MODO DEMO
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full capitalize">
          {objective}
        </span>
        {platforms.map((p) => (
          <span key={p} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full capitalize">
            {p}
          </span>
        ))}
      </div>

      {/* Headlines carousel */}
      {headlines.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-gray-400 mb-2">Titular ({headlineIdx + 1}/{headlines.length})</p>
          <p className="text-base font-semibold text-white">{headlines[headlineIdx]}</p>
          {headlines.length > 1 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => prev(headlines, headlineIdx, setHeadlineIdx)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => next(headlines, headlineIdx, setHeadlineIdx)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body copy carousel */}
      {copies.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-gray-400 mb-2">Texto del anuncio ({copyIdx + 1}/{copies.length})</p>
          <p className="text-sm text-gray-200 leading-relaxed">{copies[copyIdx]}</p>
          {copies.length > 1 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => prev(copies, copyIdx, setCopyIdx)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => next(copies, copyIdx, setCopyIdx)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video script */}
      {creatives.video_script && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-gray-400 mb-2">Guión de video (30s)</p>
          <p className="text-xs text-gray-300 leading-relaxed">{creatives.video_script}</p>
        </div>
      )}

      {/* Audiences */}
      {creatives.audiences?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Audiencias sugeridas</p>
          <div className="space-y-2">
            {creatives.audiences.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                <div>
                  <p className="text-sm text-white">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.description}</p>
                </div>
                <span className="text-xs text-emerald-400">~{a.estimated_reach.toLocaleString("es-DO")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA options */}
      {creatives.cta_options?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">CTA opciones</p>
          <div className="flex gap-2 flex-wrap">
            {creatives.cta_options.map((cta) => (
              <span key={cta} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                {cta}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
