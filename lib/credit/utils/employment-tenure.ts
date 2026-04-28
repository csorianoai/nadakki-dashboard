export interface EmploymentTenure {
  years: number;
  months: number;
  totalMonths: number;
  display: string;
  isValid: boolean;
}

export function calculateEmploymentTenure(startDate: Date | string | null): EmploymentTenure {
  if (!startDate) {
    return { years: 0, months: 0, totalMonths: 0, display: "", isValid: false };
  }

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const today = new Date();

  if (isNaN(start.getTime()) || start > today) {
    return { years: 0, months: 0, totalMonths: 0, display: "Fecha inválida", isValid: false };
  }

  const totalMonths =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth()) -
    (today.getDate() < start.getDate() ? 1 : 0);

  const safeTotal = Math.max(0, totalMonths);
  const years = Math.floor(safeTotal / 12);
  const months = safeTotal % 12;

  let display = "";
  if (years > 0 && months > 0) {
    display = `${years} ${years === 1 ? "año" : "años"}, ${months} ${months === 1 ? "mes" : "meses"}`;
  } else if (years > 0) {
    display = `${years} ${years === 1 ? "año" : "años"}`;
  } else if (months > 0) {
    display = `${months} ${months === 1 ? "mes" : "meses"}`;
  } else {
    display = "Menos de 1 mes";
  }

  return { years, months, totalMonths: safeTotal, display, isValid: true };
}
