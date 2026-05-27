"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { FileStack } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/ui/GlassCard";
import { getDocumentos } from "@/app/hooks/useProyectos";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { DocumentClassification } from "./documentos-constants";
import { normalizeDocumentList, validateDocumentFile } from "./documentos-helpers";
import { DocumentListFilters, filterDocuments } from "./DocumentListFilters";
import { DocumentListTable } from "./DocumentListTable";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { DocumentUploadZone } from "./DocumentUploadZone";

interface ProyectosDocumentosPanelProps {
  proyectoId: string;
}

export function ProyectosDocumentosPanel({ proyectoId }: ProyectosDocumentosPanelProps) {
  const tenantId = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<ReturnType<typeof normalizeDocumentList>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<DocumentClassification[]>([]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await getDocumentos(tenantId, proyectoId);
      setDocuments(normalizeDocumentList(raw));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar documentos"));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (!files.length) return;
    const valid: File[] = [];
    for (const file of files) {
      const err = validateDocumentFile(file);
      if (err) {
        toast.error(`Archivo rechazado: ${file.name}`, { description: err });
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;
    setPendingFiles(valid);
    setUploadModalOpen(true);
  }, []);

  const toggleDocType = useCallback((value: string) => {
    setSelectedDocTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const toggleClassification = useCallback((value: DocumentClassification) => {
    setSelectedClassifications((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const filtered = useMemo(
    () => filterDocuments(documents, search, selectedDocTypes, selectedClassifications),
    [documents, search, selectedDocTypes, selectedClassifications],
  );

  const allDocTypes = useMemo(() => documents.map((d) => d.doc_type), [documents]);

  return (
    <div className="space-y-8 pb-8">
      <Link
        href={`/proyectos/${encodeURIComponent(proyectoId)}`}
        className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white"
      >
        ← Detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex gap-4 p-6">
          <FileStack className="h-10 w-10 text-sky-300" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
              Document vault
            </p>
            <h1 className="text-2xl font-bold text-white">Documentos</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Repositorio legal, financiero y técnico del proyecto — cifrado en tránsito y reposo (S3 + Fernet).
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {!tenantId ? (
        <GlassCard hover={false} className="border border-amber-500/35 p-6 text-sm text-amber-100">
          Selecciona un tenant activo para gestionar documentos.
        </GlassCard>
      ) : (
        <>
          <section aria-label="Subida de documentos">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Subir archivos</h2>
            <DocumentUploadZone disabled={uploadModalOpen} onFilesSelected={handleFilesSelected} />
          </section>

          {error ? (
            <GlassCard hover={false} className="border border-rose-500/35 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error.message}
              <button
                type="button"
                className="ml-3 underline underline-offset-2"
                onClick={() => void load()}
              >
                Reintentar
              </button>
            </GlassCard>
          ) : null}

          <section aria-label="Listado de documentos">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Inventario ({filtered.length}
                {filtered.length !== documents.length ? ` de ${documents.length}` : ""})
              </h2>
            </div>

            <div className="mb-4">
              <DocumentListFilters
                search={search}
                onSearchChange={setSearch}
                docTypes={allDocTypes}
                selectedDocTypes={selectedDocTypes}
                onToggleDocType={toggleDocType}
                selectedClassifications={selectedClassifications}
                onToggleClassification={toggleClassification}
              />
            </div>

            <DocumentListTable
              tenantId={tenantId}
              documents={filtered}
              loading={loading}
              onRefresh={() => void load()}
              filteredEmpty={!loading && documents.length > 0 && filtered.length === 0}
            />
          </section>
        </>
      )}

      {tenantId ? (
        <DocumentUploadModal
          open={uploadModalOpen}
          tenantId={tenantId}
          proyectoId={proyectoId}
          files={pendingFiles}
          onClose={() => {
            setUploadModalOpen(false);
            setPendingFiles([]);
          }}
          onComplete={() => void load()}
        />
      ) : null}
    </div>
  );
}
