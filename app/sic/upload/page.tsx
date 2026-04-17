import { redirect } from "next/navigation";

/**
 * Route alias: document upload is per-expediente (API: POST .../sic/cases/{id}/documents).
 * New-case creation + first upload flow is consolidated in /sic/nuevo-analisis; avoid a second fake wizard.
 */
export default function SicUploadAliasPage() {
  redirect("/sic/nuevo-analisis");
}
