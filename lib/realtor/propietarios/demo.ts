import type { OwnerRow } from "./types";

/** Datos sintéticos: prefijo SYNTH. Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". Sin teléfonos ni correos en esta pantalla. */
export const DEMO_OWNERS: readonly OwnerRow[] = [
  { id: "o1", name: "SYNTH Propietario 1", role: "arrendador", property: "SYNTH Apartamento A", priceUsd: 3200, agreement: "vigente", stage: "en-operacion",
    followUp: { es: "Confirmar con el propietario la aprobación del HOA", en: "Confirm the HOA approval with the owner" } },
  { id: "o2", name: "SYNTH Propietario 2", role: "arrendador", property: "SYNTH Apartamento B", priceUsd: 3350, agreement: "vigente", stage: "disponible",
    followUp: { es: "Llamar el lunes para revisar el precio", en: "Call on Monday to review the price" } },
  { id: "o3", name: "SYNTH Propietario 3", role: "vendedor", property: "SYNTH Casa C", priceUsd: 485000, agreement: "borrador", stage: "listing-activo",
    followUp: { es: "Enviar borrador del acuerdo de representación", en: "Send the draft representation agreement" } },
];
