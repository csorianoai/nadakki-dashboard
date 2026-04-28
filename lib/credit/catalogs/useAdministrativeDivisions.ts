"use client";

import { DOMINICAN_PROVINCES, type AdministrativeDivision } from "./dominican-provinces";

const FALLBACK_DIVISIONS: AdministrativeDivision[] = [
  { code: "NA", name: "No disponible", municipalities: ["No disponible"] },
];

export function getAdministrativeDivisions(countryCode: string | null | undefined): AdministrativeDivision[] {
  if ((countryCode || "").toUpperCase() === "DO") return DOMINICAN_PROVINCES;
  return FALLBACK_DIVISIONS;
}

export function useAdministrativeDivisions(countryCode: string | null | undefined): AdministrativeDivision[] {
  return getAdministrativeDivisions(countryCode);
}
