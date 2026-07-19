"use client";

/**
 * GR-14 — persistent legal assistance disclaimer (non-dismissable).
 */
export function LegalGr14Banner({ compact = false }: { compact?: boolean }) {
  const text =
    "Asistencia legal automatizada — requiere revisión de abogado. No constituye asesoría legal definitiva.";

  if (compact) {
    return (
      <p className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-xs text-amber-950" role="note">
        <strong className="font-semibold">GR-14:</strong> {text}
      </p>
    );
  }

  return (
    <div
      className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
      role="note"
      aria-label="Aviso legal GR-14"
    >
      <strong className="font-semibold">GR-14:</strong> {text}
    </div>
  );
}
