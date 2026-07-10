"use client";

function formatValidity(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const now = Date.now();
    if (d.getTime() < now) return "Vencida";
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(d);
  } catch {
    return null;
  }
}

/** Shows offer validity from raw offer payload when present (contract-first, no invented dates). */
export function OfferValidityBadge({ validUntil }: { validUntil?: string | null }) {
  const label = formatValidity(validUntil ?? null);
  if (!label) return null;

  const expired = label === "Vencida";
  return (
    <span
      className="rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: expired ? "var(--ch-danger-soft)" : "var(--ch-info-soft)",
        color: expired ? "var(--ch-danger-text)" : "var(--ch-info-text)",
      }}
      data-testid="offer-validity-badge"
    >
      {expired ? "Oferta vencida" : `Vigente hasta ${label}`}
    </span>
  );
}

export function extractOfferValidUntil(offer: { raw?: unknown }): string | null {
  const raw = offer.raw;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const terms = r.terms as Record<string, unknown> | undefined;
  const candidate =
    r.valid_until ?? r.validity_until ?? r.expires_at ?? terms?.valid_until ?? terms?.validity_until;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}
