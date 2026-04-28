export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTenure(startDate: Date): string {
  const today = new Date();
  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  if (today.getDate() < startDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const yearLabel = years === 1 ? "año" : "años";
  const monthLabel = months === 1 ? "mes" : "meses";
  return `${Math.max(0, years)} ${yearLabel}, ${Math.max(0, months)} ${monthLabel}`;
}
