export function formatDominicanCedula(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 10) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
}

export function cleanDominicanCedula(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}
