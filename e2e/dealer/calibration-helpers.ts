import type { Page } from "@playwright/test";

/** Drives T6.4 “Ajustes rápidos” panel on `/credit-hub/dealer/applications/[id]`. */
export async function fillHealthCalibration(
  page: Page,
  vals: {
    credit?: number;
    dti?: number;
    ltv?: number;
    employmentYears?: number;
    documentsProvided?: number;
    documentsRequired?: number;
  }
): Promise<void> {
  const setIf = async (label: RegExp, value: number | undefined) => {
    if (value === undefined) return;
    await page.getByLabel(label).fill(String(value));
  };
  await setIf(/Credit score proxy/i, vals.credit);
  await setIf(/DTI %/i, vals.dti);
  await setIf(/LTV %/i, vals.ltv);
  await setIf(/Años empleo/i, vals.employmentYears);
  await setIf(/Docs provistos/i, vals.documentsProvided);
  await setIf(/Docs requeridos/i, vals.documentsRequired);
}
