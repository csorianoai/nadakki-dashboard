/** Rótulos del cajón de centros (ROP-UX-NAV-MOVIL). El armazón no tiene idioma propio: ES por defecto, EN listo. */
export type ShellNavLang = "es" | "en";

export const SHELL_NAV_COPY: Record<ShellNavLang, { menu: string; close: string }> = {
  es: { menu: "Menú de centros", close: "Cerrar menú de centros" },
  en: { menu: "Centers menu", close: "Close centers menu" },
};
