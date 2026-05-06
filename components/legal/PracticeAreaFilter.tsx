"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PRACTICE_AREAS_BY_CATEGORY, type PracticeArea, type PracticeAreaCategory } from "@/lib/legal/practice-areas";
import { PracticeAreaChip } from "./PracticeAreaChip";

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
};

const CATEGORY_LABELS_ES: Record<PracticeAreaCategory, string> = {
  comercial_financiero: "Comercial / Financiero",
  civil_familiar: "Civil / Familiar",
  publico: "Público",
  penal_litigio: "Litigio penal",
  trabajo: "Laboral",
  propiedad_intelectual: "Propiedad Intelectual",
  especializado: "Especializado",
};

export function PracticeAreaFilter({
  selected,
  onChange,
  placeholder = "Filtrar por área legal",
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  const clearAll = () => onChange([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          flex min-h-[36px] items-center gap-2
          rounded border border-[var(--color-border-subtle)]
          bg-[var(--color-surface-1)]
          px-3 py-1.5
          text-sm
          hover:border-[var(--color-border-strong)]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]
        "
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
      >
        <span className="text-[var(--color-text-secondary)]">
          {selected.length === 0 ? placeholder : `${selected.length} áreas seleccionadas`}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {selected.map((slug) => (
            <PracticeAreaChip key={slug} tag={slug} size="sm" removable onRemove={() => toggle(slug)} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs text-[var(--color-text-tertiary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {open && (
        <div
          ref={panelRef}
          id={listId}
          className="
            absolute z-50 mt-2
            max-h-96 w-72 overflow-auto
            rounded-md border border-[var(--color-border-strong)]
            bg-[var(--color-surface-1)]
            p-3 shadow-lg
          "
          role="listbox"
          aria-multiselectable
        >
          {(
            Object.entries(PRACTICE_AREAS_BY_CATEGORY) as [PracticeAreaCategory, PracticeArea[]][]
          ).map(([cat, areas]) => (
              <div key={cat} className="mb-3 last:mb-0">
                <h4 className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {CATEGORY_LABELS_ES[cat]}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {areas.map((area) => {
                    const isSelected = selected.includes(area.slug);
                    return (
                      <button
                        key={area.slug}
                        type="button"
                        onClick={() => toggle(area.slug)}
                        className={[
                          "rounded border px-2 py-1 text-xs transition",
                          isSelected
                            ? "border-[var(--color-accent-blue-border)] bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-blue-strong)]"
                            : "border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]",
                        ].join(" ")}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {area.display_es}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
