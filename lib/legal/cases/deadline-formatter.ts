/** Días hasta la fecha efectiva (ISO yyyy-mm-dd). Negativo = vencido. */
export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
