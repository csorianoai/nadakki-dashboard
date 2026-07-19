"use client";

/** PR-5 — persistencia documentos no garantizada (deuda S3). */
export function LegalDocumentsS3WarningBanner() {
  return (
    <div
      className="rounded-forge-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="alert"
    >
      <strong className="font-semibold">ADVERTENCIA:</strong> persistencia de documentos no garantizada (deuda
      S3) — no subir documentos reales.
    </div>
  );
}
