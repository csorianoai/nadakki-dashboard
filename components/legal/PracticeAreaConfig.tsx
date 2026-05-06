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
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
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
                  ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
                  : "border-[var(--color-border-subtle)] bg-transparent opacity-50",
              ].join(" ")}
              title={area.description_es}
            >
              <span className="text-sm">{area.display_es}</span>
              {isActive && <span className="text-xs text-[var(--color-success-strong)]">●</span>}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)]">
        Para modificar las áreas activas, contacta al administrador del tenant.
      </p>
    </div>
  );
}
