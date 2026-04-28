export function formatDop(value: number | null | undefined): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatPercent(value: number | null | undefined): string {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}
