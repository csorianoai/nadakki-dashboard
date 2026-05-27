"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import {
  CLASSIFICATION_LABELS,
  DOCUMENT_CLASSIFICATIONS,
  type DocumentClassification,
} from "./documentos-constants";
import { docTypeLabel, uniqueSorted } from "./documentos-helpers";

interface DocumentListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  docTypes: string[];
  selectedDocTypes: string[];
  onToggleDocType: (value: string) => void;
  selectedClassifications: DocumentClassification[];
  onToggleClassification: (value: DocumentClassification) => void;
}

function FilterPill({
  active,
  label,
  onClick,
  activeClass,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? activeClass
          : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

export function DocumentListFilters({
  search,
  onSearchChange,
  docTypes,
  selectedDocTypes,
  onToggleDocType,
  selectedClassifications,
  onToggleClassification,
}: DocumentListFiltersProps) {
  const typeOptions = uniqueSorted(docTypes);

  return (
    <GlassCard hover={false} className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        <Filter className="h-3.5 w-3.5" style={{ color: BP_ACCENTS.glow }} aria-hidden />
        Filtros (client-side)
      </div>

      <Input
        label="Buscar por nombre"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Nombre del archivo…"
        prefix={<Search className="h-4 w-4 text-zinc-500" aria-hidden />}
      />

      {typeOptions.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-400">Tipo de documento</p>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((type) => (
              <FilterPill
                key={type}
                label={docTypeLabel(type)}
                active={selectedDocTypes.includes(type)}
                onClick={() => onToggleDocType(type)}
                activeClass="border-amber-400/40 bg-amber-500/15 text-amber-100"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-400">Clasificación</p>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_CLASSIFICATIONS.map((c) => (
            <FilterPill
              key={c}
              label={CLASSIFICATION_LABELS[c]}
              active={selectedClassifications.includes(c)}
              onClick={() => onToggleClassification(c)}
              activeClass={
                c === "public"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                  : c === "internal"
                    ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                    : c === "confidential"
                      ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                      : "border-rose-400/40 bg-rose-500/15 text-rose-100"
              }
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export function filterDocuments<T extends { filename_original: string; doc_type: string; classification: string }>(
  rows: T[],
  search: string,
  selectedDocTypes: string[],
  selectedClassifications: string[],
): T[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (q && !row.filename_original.toLowerCase().includes(q)) return false;
    if (selectedDocTypes.length > 0 && !selectedDocTypes.includes(row.doc_type)) return false;
    if (selectedClassifications.length > 0 && !selectedClassifications.includes(row.classification as DocumentClassification)) {
      return false;
    }
    return true;
  });
}
