import type { Bi } from "../copy-util";

/** Textos de la vista previa de Mi web. */
export const VP: Record<string, Bi> = {
  title: { es: "Vista previa", en: "Preview" },
  notice: { es: "Vista aproximada: la web publicada puede diferir", en: "Approximate preview: the published website may differ" },
  noSite: { es: "Elija un sitio para ver su vista previa.", en: "Choose a site to see its preview." },
  language: { es: "Idioma de la vista", en: "Preview language" },
  device: { es: "Tamaño de pantalla", en: "Screen size" },
  mobile: { es: "Móvil", en: "Mobile" },
  desktop: { es: "Escritorio", en: "Desktop" },
  page: { es: "Página", en: "Page" },
  loading: { es: "Cargando la vista previa…", en: "Loading the preview…" },
  noPages: { es: "Este sitio todavía no tiene páginas.", en: "This site has no pages yet." },
  untitled: { es: "Página sin título", en: "Untitled page" },
  listings: { es: "Propiedades", en: "Listings" },
  noListings: { es: "Aún no hay propiedades.", en: "No listings yet." },
  fallbackEs: { es: "Texto en español: falta la traducción.", en: "Spanish text: translation missing." },
  legalSlot: { es: "Lo agrega Nadakki", en: "Added by Nadakki" },
  imageOk: { es: "Imagen aprobada", en: "Approved image" },
  frame: { es: "Vista previa del borrador", en: "Draft preview" },
  notFoundTitle: { es: "Sitio no encontrado", en: "Site not found" },
  notFoundBody: { es: "No encontramos ese sitio. No se muestra ningún dato.", en: "We could not find that site. No data is shown." },
  errTitle: { es: "No se pudo cargar la vista previa", en: "The preview could not be loaded" },
};

export const VP_ERR: Record<string, Bi> = {
  TENANT_MISMATCH: { es: "Su sesión no corresponde a este sitio.", en: "Your session does not match this site." },
  FORBIDDEN: { es: "No tiene permiso para ver este sitio.", en: "You do not have permission to view this site." },
  UNAUTHENTICATED: { es: "Su sesión venció. Ingrese de nuevo.", en: "Your session expired. Sign in again." },
  RATE_LIMITED: { es: "Demasiadas solicitudes. Espere un momento.", en: "Too many requests. Please wait a moment." },
  NETWORK: { es: "No hay conexión con el servicio. Intente de nuevo.", en: "No connection to the service. Please try again." },
  DEFAULT: { es: "Ocurrió un problema. Intente de nuevo más tarde.", en: "Something went wrong. Please try again later." },
};
