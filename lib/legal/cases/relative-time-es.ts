/** Etiquetas relativas muy legibles para actividad en expedientes (es-DO neutral). */

export function formatRelativeActivityEs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "hace instantes";
  if (mins < 60) return `hace ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
