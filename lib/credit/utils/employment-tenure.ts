export function calculateEmploymentTenure(startDate: Date | string | null): {
  years: number;
  months: number;
  totalMonths: number;
  display: string;
  isValid: boolean;
} {
  if (!startDate) return { years: 0, months: 0, totalMonths: 0, display: "", isValid: false };

  const start = typeof startDate === "string" ? new Date(`${startDate}T00:00:00`) : startDate;
  const today = new Date();

  if (Number.isNaN(start.getTime()) || start > today) {
    return { years: 0, months: 0, totalMonths: 0, display: "Fecha inválida", isValid: false };
  }

  const totalMonths =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth()) -
    (today.getDate() < start.getDate() ? 1 : 0);

  const years = Math.floor(Math.max(0, totalMonths) / 12);
  const months = Math.max(0, totalMonths) % 12;

  let display = "";
  if (years > 0 && months > 0) display = `${years} ${years === 1 ? "año" : "años"}, ${months} ${months === 1 ? "mes" : "meses"}`;
  else if (years > 0) display = `${years} ${years === 1 ? "año" : "años"}`;
  else if (months > 0) display = `${months} ${months === 1 ? "mes" : "meses"}`;
  else display = "Menos de 1 mes";

  return { years, months, totalMonths, display, isValid: true };
}
