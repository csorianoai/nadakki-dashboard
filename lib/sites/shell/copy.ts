import type { Bi, Lang } from "../copy-util";
export type { Lang };

/** Textos del armazon de Mi web. 'es' obligatorio; el respaldo a 'es' lo hace pick(). */
export const SHELL: Record<string, Bi> = {
  brand: { es: "Mi web", en: "My website" },
  skip: { es: "Saltar al contenido", en: "Skip to content" },
  language: { es: "Idioma", en: "Language" },
  navLabel: { es: "Secciones", en: "Sections" },
  demo: { es: "DEMO", en: "DEMO" },
  demoNote: { es: "Datos de ejemplo: no son los de su sitio.", en: "Sample data: not your site's data." },
  checking: { es: "Comprobando su acceso…", en: "Checking your access…" },
  noAccessTitle: { es: "Sin acceso", en: "No access" },
  noAccessBody: { es: "Su usuario no tiene permiso para administrar el sitio web. Pida acceso a quien administra su cuenta.", en: "Your user cannot manage the website. Ask your account administrator for access." },
  unavailableTitle: { es: "Mi web no está disponible", en: "My website is not available" },
  unavailableBody: { es: "No pudimos conectar con el servicio del sitio web. No se muestra ningún dato hasta que vuelva a estar disponible. Intente de nuevo más tarde.", en: "We could not reach the website service. No data is shown until it is available again. Please try again later." },
  emptyTitle: { es: "Aún no hay un sitio", en: "No website yet" },
  emptyBody: { es: "Su cuenta todavía no tiene un sitio web creado, por eso no hay nada que mostrar.", en: "Your account does not have a website yet, so there is nothing to show." },
  secResumen: { es: "Resumen", en: "Overview" },
  secPaginas: { es: "Páginas", en: "Pages" },
  secPropiedades: { es: "Propiedades", en: "Listings" },
  secMedios: { es: "Medios", en: "Media" },
  secDesarrollos: { es: "Desarrollos", en: "Developments" },
  secPublicar: { es: "Publicar", en: "Publish" },
  secVista: { es: "Vista previa", en: "Preview" },
};

export const SECCIONES = [
  { key: "secResumen", path: "/mi-web" },
  { key: "secPaginas", path: "/mi-web/paginas" },
  { key: "secPropiedades", path: "/mi-web/propiedades" },
  { key: "secMedios", path: "/mi-web/medios" },
  { key: "secDesarrollos", path: "/mi-web/desarrollos" },
  { key: "secPublicar", path: "/mi-web/publicar" },
  { key: "secVista", path: "/mi-web/vista-previa" },
] as const;
