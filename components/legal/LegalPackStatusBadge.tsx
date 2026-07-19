"use client";

export function LegalPackStatusBadge({ status }: { status: string | undefined | null }) {
  const normalized = (status ?? "unknown").toLowerCase();
  if (normalized === "verified") {
    return (
      <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-900">
        VERIFIED
      </span>
    );
  }
  if (normalized.includes("skeleton") || normalized.includes("pending") || normalized.includes("draft")) {
    return (
      <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-950">
        DRAFT — NO CERTIFICADO
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-800">
      {status ?? "UNKNOWN"}
    </span>
  );
}
