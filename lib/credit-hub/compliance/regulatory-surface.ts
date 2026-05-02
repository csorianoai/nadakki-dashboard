import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";

export type ForgeComplianceSurface = {
  heroTitle: string;
  heroDescription: string;
  issuesSectionTitle: string;
  rtbfDescription: string;
};

/** Bank compliance hero + retention copy driven by `regulatory_profile` (no backend change). */
export function getForgeComplianceSurface(config: TenantBankingConfig): ForgeComplianceSurface {
  const profile = (config.regulatory_profile || "").toUpperCase();
  if (profile === "CNBV_MX" || profile.startsWith("CNBV")) {
    return {
      heroTitle: "Perfil CNBV (México)",
      heroDescription:
        "Disposiciones de la CNBV sobre prevención de lavado de dinero, identificación del cliente y conservación de expedientes crediticios.",
      issuesSectionTitle: "Observaciones AML / KYC (CNBV)",
      rtbfDescription:
        "Las solicitudes de supresión de datos personales se evalúan conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México). La institución conserva expedientes y evidencias de decisiones por un mínimo de 10 años, salvo disposición legal o resolución de autoridad competente.",
    };
  }
  return {
    heroTitle: "Ley 172-13 (República Dominicana)",
    heroDescription: "Consentimientos, documentación mínima y trazabilidad de decisiones conforme a INDOTEL y la Ley 172-13.",
    issuesSectionTitle: "Observaciones Ley 172-13",
    rtbfDescription:
      "Buscar por correo o cédula requiere revisión manual de cumplimiento antes de ejecutar eliminación. El servicio registra la solicitud y evita borrado accidental. Retención mínima de expedientes: 5 años conforme perfil INDOTEL (DO).",
  };
}
