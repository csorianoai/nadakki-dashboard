"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import {
  buildPreviewFetchInit,
  resolvePdfSourceUrl,
  type DocumentPreviewMetadata,
} from "@/lib/bank/document-preview-api";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export interface DocumentPreviewPaneProps {
  documentId: string;
  applicationId: string;
  tenantId: string;
  authToken?: string;
}

type ZoomPreset = number | "fit-width" | "fit-page";

/** Panel de vista PDF (T6.1 backend) usando react-pdf. */
export function DocumentPreviewPane({
  documentId,
  applicationId,
  tenantId,
  authToken,
}: DocumentPreviewPaneProps): React.ReactElement {
  const { metadata, loading: loadingMeta, error: metaErr, refetch } = useDocumentPreview({
    documentId,
    applicationId,
    tenantId,
    authToken,
  });

  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>(100);
  const [rotation, setRotation] = useState(0);
  const [comparingDocId, setComparingDocId] = useState<string | null>(null);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [secondaryUrl, setSecondaryUrl] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const [touchBoost, setTouchBoost] = useState(1);
  const pinchBase = useRef<{ dist: number; boost: number } | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const metaPagesHint = metadata?.pages ?? metadata?.page_count;

  useEffect(() => {
    if (typeof metaPagesHint === "number" && metaPagesHint >= 1) {
      setNumPages(metaPagesHint);
    }
  }, [metaPagesHint]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function fetchPdf(meta: DocumentPreviewMetadata | null) {
      try {
        setViewerError(null);
        const resolved = resolvePdfSourceUrl(meta, applicationId, documentId);
        const res = await fetch(resolved, {
          ...buildPreviewFetchInit(tenantId, authToken, {
            headers: { Accept: "application/pdf,*/*" },
            cache: "default",
          }),
        });
        if (!res.ok) throw new Error(`PDF ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPrimaryUrl(objectUrl);
      } catch {
        if (!cancelled) setViewerError("No pudimos obtener el archivo PDF institucional.");
      }
    }

    void fetchPdf(metadata ?? null);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [applicationId, authToken, documentId, metadata, tenantId]);

  useEffect(() => {
    if (!comparingDocId) {
      setSecondaryUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    async function secondary() {
      try {
        const resolved = resolvePdfSourceUrl(null, applicationId, comparingDocId);
        const res = await fetch(
          resolved,
          buildPreviewFetchInit(tenantId, authToken, {
            headers: { Accept: "application/pdf,*/*" },
            cache: "default",
          })
        );
        if (!res.ok) throw new Error("compare");
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSecondaryUrl(objectUrl);
      } catch {
        if (!cancelled) setSecondaryUrl(null);
      }
    }

    void secondary();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [applicationId, authToken, comparingDocId, tenantId]);

  const handleLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages);
    setCurrentPage((cp) => Math.min(cp, doc.numPages));
  }, []);

  const combinedError = viewerError ?? metaErr;

  const pageScale = useMemo(() => {
    let base =
      zoomPreset === "fit-width" || zoomPreset === "fit-page"
        ? 1
        : (zoomPreset as number) / 100;
    base *= touchBoost;
    return Math.min(Math.max(base, 0.4), 3);
  }, [touchBoost, zoomPreset]);

  const pageWidthPx =
    zoomPreset === "fit-width" ? Math.max((viewerRef.current?.clientWidth ?? 720) - 24, 300) : undefined;

  function onTouchStart(ev: React.TouchEvent) {
    if (ev.touches.length !== 2) return;
    const dx = ev.touches[0].clientX - ev.touches[1].clientX;
    const dy = ev.touches[0].clientY - ev.touches[1].clientY;
    pinchBase.current = { dist: Math.hypot(dx, dy), boost: touchBoost };
  }

  function onTouchMove(ev: React.TouchEvent) {
    if (ev.touches.length !== 2 || !pinchBase.current) return;
    const dx = ev.touches[0].clientX - ev.touches[1].clientX;
    const dy = ev.touches[0].clientY - ev.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / pinchBase.current.dist;
    const next = Math.min(3, Math.max(0.5, pinchBase.current.boost * ratio));
    setTouchBoost(Number(next.toFixed(2)));
  }

  async function triggerDownload(kind: "primary" | "compare") {
    const doc = kind === "primary" ? documentId : comparingDocId;
    if (!doc) return;
    try {
      const resolved = resolvePdfSourceUrl(kind === "primary" ? metadata : null, applicationId, doc);
      const res = await fetch(
        resolved,
        buildPreviewFetchInit(tenantId, authToken, { headers: { Accept: "application/pdf,*/*" } })
      );
      const blob = await res.blob();
      const link = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.download = `${doc}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(link), 60_000);
    } catch {
      setViewerError("Falló descarga segura desde API.");
    }
  }

  function triggerPrint(blobUrl: string | null | undefined): void {
    if (!blobUrl) return;
    const win = window.open(blobUrl, "_blank");
    win?.focus();
    win?.print();
    window.setTimeout(() => win?.close(), 1000);
  }

  function startComparePrompt() {
    const next = typeof window !== "undefined" ? window.prompt("ID documento paralelo:", comparingDocId ?? "") : "";
    const trimmed = (next ?? "").trim();
    if (trimmed) setComparingDocId(trimmed);
  }

  return (
    <div className="document-preview-pane flex h-full flex-col gap-3" data-testid="document-preview-pane">
      <PreviewToolbar
        zoomPreset={zoomPreset}
        rotation={rotation}
        currentPage={currentPage}
        totalPages={numPages}
        comparingDocId={comparingDocId}
        setZoomPreset={setZoomPreset}
        onRotate={(deg) => setRotation((r) => (r + deg + 360) % 360)}
        onReloadMeta={() => void refetch()}
        onPickCompare={startComparePrompt}
        clearCompare={() => setComparingDocId(null)}
        pageFirst={() => setCurrentPage(1)}
        pagePrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        pageNext={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
        pageLast={() => setCurrentPage(numPages)}
        onDownloadPrimary={() => void triggerDownload("primary")}
        onDownloadSecondary={() => void triggerDownload("compare")}
        onPrintPrimary={() => triggerPrint(primaryUrl)}
      />

      {loadingMeta ? (
        <p className="text-forge-xs text-forgeGray-600" role="status" data-testid="preview-loading-meta">
          Cargando metadatos T6.1 …
        </p>
      ) : null}

      {combinedError ? (
        <div className="rounded-md bg-rose-50 p-2 text-forge-xs text-rose-800" role="alert" data-testid="preview-error">
          {combinedError}. Revise Tenant / Bearer / política CSP.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-3">
        <ThumbnailSidebar
          pages={numPages || 1}
          currentPage={currentPage}
          onSelect={(p) => setCurrentPage(p)}
        />

        <div
          ref={viewerRef}
          className="main-viewer thin-scrollbar overflow-auto rounded border border-forgeGray-200 bg-white p-2"
          role="presentation"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          data-testid="pdf-main-view"
        >
          <div className={secondaryUrl ? "comparison-mode grid gap-4 md:grid-cols-2" : undefined}>
            <div className={secondaryUrl ? "min-h-[460px]" : "min-h-[520px] w-full"}>
              {primaryUrl ? (
                <div data-testid="pdf-document">
                  <Document
                    file={primaryUrl}
                    loading={<span data-testid="pdf-loading-spinner">Montando viewer…</span>}
                    onLoadSuccess={(d) => handleLoadSuccess(d)}
                    onLoadError={() => setViewerError("Error render PDF.js")}
                  >
                    <Page
                      scale={zoomPreset === "fit-page" ? 1 : pageScale}
                      width={pageWidthPx ?? undefined}
                      pageNumber={Math.min(Math.max(currentPage, 1), Math.max(numPages, 1))}
                      rotate={rotation}
                    />
                  </Document>
                </div>
              ) : (
                <p className="text-forge-xs text-forgeGray-500">Sin binario hasta que `/download` devuelva bytes.</p>
              )}
            </div>

            {secondaryUrl ? (
              <div className="min-h-[460px] rounded border border-dashed p-2" data-testid="comparison-pane">
                <p className="mb-2 text-[10px] font-semibold uppercase text-forgeGray-500">
                  Comparativo · {comparingDocId}
                </p>
                <Document file={secondaryUrl}>
                  <Page pageNumber={1} />
                </Document>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewToolbar(props: {
  zoomPreset: ZoomPreset;
  rotation: number;
  currentPage: number;
  totalPages: number;
  comparingDocId: string | null;
  setZoomPreset: (z: ZoomPreset) => void;
  onRotate: (deg: number) => void;
  onReloadMeta: () => void;
  onPickCompare: () => void;
  clearCompare: () => void;
  pageFirst: () => void;
  pagePrev: () => void;
  pageNext: () => void;
  pageLast: () => void;
  onDownloadPrimary: () => void;
  onDownloadSecondary: () => void;
  onPrintPrimary: () => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2 border-b border-forgeGray-200 pb-2" data-testid="preview-toolbar" aria-label="controles vista previa PDF">
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] uppercase text-forgeGray-500">Zoom</span>
        {[50, 100, 150, 200].map((z) => (
          <button key={z} type="button" className="rounded px-2 py-1 text-forge-xs focus-visible:ring-2" aria-pressed={props.zoomPreset === z} onClick={() => props.setZoomPreset(z)}>
            {z}%
          </button>
        ))}
        <button type="button" className="text-forge-xs" data-testid="zoom-fit-width" onClick={() => props.setZoomPreset("fit-width")}>
          Ajustar ancho
        </button>
        <button type="button" className="text-forge-xs" data-testid="zoom-fit-page" onClick={() => props.setZoomPreset("fit-page")}>
          Ajustar página
        </button>
      </div>
      <div className="flex gap-2 text-forge-xs">
        <span aria-live="polite">{props.rotation}°</span>
        <button type="button" aria-label="+90 rotation" data-testid="rotate-90" onClick={() => props.onRotate(90)}>
          +90°
        </button>
        <button type="button" data-testid="rotate-180" onClick={() => props.onRotate(180)}>
          180°
        </button>
        <button type="button" data-testid="rotate-270-minus90" onClick={() => props.onRotate(-90)}>
          -90°
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-forge-xs" aria-label="navegar páginas">
        <button type="button" data-testid="page-first" onClick={props.pageFirst}>
          primera
        </button>
        <button type="button" data-testid="page-prev" onClick={props.pagePrev}>
          prev
        </button>
        <span data-testid="page-indicator">
          {props.currentPage} / {props.totalPages}
        </span>
        <button type="button" data-testid="page-next" onClick={props.pageNext}>
          next
        </button>
        <button type="button" data-testid="page-last" onClick={props.pageLast}>
          última
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-forge-xs">
        <button type="button" data-testid="compare-trigger" onClick={props.onPickCompare}>
          Comparativa
        </button>
        <button type="button" disabled={!props.comparingDocId} data-testid="compare-clear" onClick={props.clearCompare}>
          Cerrar B
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-forge-xs">
        <button type="button" data-testid="download-doc" onClick={props.onDownloadPrimary}>
          Descarga
        </button>
        <button type="button" disabled={!props.comparingDocId} data-testid="download-compare" onClick={props.onDownloadSecondary}>
          Descarga B
        </button>
        <button type="button" data-testid="print-doc" onClick={props.onPrintPrimary}>
          Imprimir
        </button>
      </div>

      <button type="button" className="text-forge-xs underline" data-testid="reload-meta" onClick={props.onReloadMeta}>
        Reload meta · cache-default
      </button>
    </div>
  );
}

function ThumbnailSidebar({
  pages,
  currentPage,
  onSelect,
}: {
  pages: number;
  currentPage: number;
  onSelect: (p: number) => void;
}): React.ReactElement {
  const items = Array.from({ length: Math.min(pages, 200) }, (_, i) => i + 1);
  return (
    <aside data-testid="thumbnail-sidebar" className="thin-scrollbar w-[132px] space-y-1 overflow-y-auto pr-2" aria-label="miniaturas de página">
      {items.map((p) => (
        <button
          key={p}
          type="button"
          data-thumb-page={p}
          className={`w-full rounded border px-2 py-1 text-left text-forge-xs focus-visible:outline focus-visible:ring-2 ${
            currentPage === p ? "border-forgeBrand-600 bg-forgeGray-50" : "border-forgeGray-200"
          }`}
          aria-current={currentPage === p}
          aria-label={`mini página ${p}`}
          tabIndex={0}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") onSelect(p);
          }}
          onClick={() => onSelect(p)}
        >
          Página · {p}
        </button>
      ))}
    </aside>
  );
}
