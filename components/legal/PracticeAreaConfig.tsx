"use client";

import { PRACTICE_AREAS } from "@/lib/legal/practice-areas";

type Props = {
  activeAreas: string[];
};

export function PracticeAreaConfig({ activeAreas }: Props) {
  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-sm font-medium">Áreas legales activas</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Configurado para tu institución. Los agentes solo procesarán documentos dentro de estas áreas.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {PRACTICE_AREAS.map((area) => {
          const isActive = activeAreas.includes(area.slug);
          return (
            <div
              key={area.slug}
              className={[
                "flex items-center justify-between rounded border px-3 py-2",
                isActive
                  ? "border-zinc-700 bg-zinc-900"
                  : "border-zinc-700 bg-transparent opacity-60",
              ].join(" ")}
              title={area.description_es}
            >
              <span className="text-sm">{area.display_es}</span>
              {isActive && <span className="text-xs text-emerald-400">●</span>}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Para modificar las áreas activas, contacta al administrador del tenant.
      </p>
    </div>
  );
}
