import type { Bi } from "../copy-util";
import type { SiteStatus } from "../types";

export const RESUMEN: Record<string, Bi> = {
  title: { es: "Resumen del sitio", en: "Website overview" },
  siteSelect: { es: "Sitio", en: "Website" },
  status: { es: "Estado", en: "Status" },
  version: { es: "Versión del contenido", en: "Content version" },
  lastPublished: { es: "Última publicación", en: "Last published" },
  neverPublished: { es: "Aún no se ha publicado", en: "Not published yet" },
  gate: { es: "Resultado de la última revisión", en: "Latest review result" },
  goPublish: { es: "Ir a Publicar", en: "Go to Publish" },
  loading: { es: "Cargando el sitio…", en: "Loading the website…" },
  blocksOne: { es: "regla bloquea la publicación", en: "rule blocks publishing" },
  blocksMany: { es: "reglas bloquean la publicación", en: "rules block publishing" },
  blocksUnknown: { es: "No pudimos comprobar si hay bloqueos pendientes.", en: "We could not check for pending blockers." },
  notFoundTitle: { es: "Sitio no encontrado", en: "Website not found" },
  notFoundBody: { es: "No encontramos ese sitio en su cuenta. Elija otro desde el menú de sitios.", en: "We could not find that website in your account. Pick another one from the website menu." },
  loadError: { es: "No pudimos cargar el sitio. Intente de nuevo más tarde.", en: "We could not load the website. Please try again later." },
};

export const ESTADO: Record<SiteStatus, Bi> = {
  draft: { es: "Borrador", en: "Draft" },
  in_review: { es: "En revisión", en: "In review" },
  published: { es: "Publicado", en: "Published" },
  suspended: { es: "Suspendido", en: "Suspended" },
};

export const GATE: Record<string, Bi> = {
  pass: { es: "Aprobado", en: "Passed" },
  warn: { es: "Con advertencias", en: "Passed with warnings" },
  block: { es: "Bloqueado", en: "Blocked" },
  none: { es: "Sin evaluar", en: "Not reviewed yet" },
};
