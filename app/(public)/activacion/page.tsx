import { PantallaEspera } from "@/components/activation/PantallaEspera";

export const metadata = {
  title: "Estado de activación - Nadakki",
  description: "Verifica el estado de tu solicitud de activación",
};

// Esta es una página de ejemplo. En producción, el estado vendría de una API
// que consulta el tenant basado en la sesión del usuario.
export default function EsperaPage() {
  // TODO: Obtener estado real del backend
  // GET /api/v2/institucion/readiness o similar
  const status = "VALIDATION"; // Ejemplo

  return (
    <PantallaEspera
      status={status}
      contactEmail="soporte@nadakki.com"
      tenantName="Tu Institución"
    />
  );
}
