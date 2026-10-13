import type { Contact } from "./types";

/** Datos sintéticos: prefijo SYNTH, teléfonos 555-01xx y correos @example.invalid. Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_CONTACTS: readonly Contact[] = [
  { id: "c1", name: "SYNTH Contacto 1", role: "inquilino", roleActive: true, origin: "portal", leadStatus: "calificado",
    phone: "305-555-0101", email: "synth1@example.invalid", summary: { es: "Alquiler · Sunny Isles Beach · hasta USD 3,200/mes", en: "Rental · Sunny Isles Beach · up to USD 3,200/mo" } },
  { id: "c2", name: "SYNTH Contacto 2", role: "comprador", roleActive: true, origin: "referido", leadStatus: "contactado",
    phone: "305-555-0102", email: "synth2@example.invalid", summary: { es: "Compra · Aventura · USD 450,000–500,000", en: "Purchase · Aventura · USD 450,000–500,000" } },
  { id: "c3", name: "SYNTH Contacto 3", role: "vendedor", roleActive: true, origin: "web", leadStatus: null,
    phone: "305-555-0103", email: "synth3@example.invalid", summary: { es: "Venta · Bal Harbour · 2 habitaciones", en: "Sale · Bal Harbour · 2 bedrooms" } },
  { id: "c4", name: "SYNTH Contacto 4", role: "comprador", roleActive: false, origin: "redes", leadStatus: "nuevo",
    phone: "305-555-0104", email: "synth4@example.invalid", summary: { es: "Pidió información desde una publicación", en: "Asked for information from a post" } },
  { id: "c5", name: "SYNTH Contacto 5", role: null, roleActive: false, origin: "portal", leadStatus: "contactado",
    phone: "305-555-0105", email: "synth5@example.invalid", summary: { es: "Vio 3 propiedades en el portal", en: "Viewed 3 properties on the portal" } },
  { id: "c6", name: "SYNTH Contacto 6", role: null, roleActive: false, origin: "web", leadStatus: "perdido",
    phone: "305-555-0106", email: "synth6@example.invalid", summary: { es: "Sin respuesta desde hace 60 días", en: "No reply for 60 days" } },
];
