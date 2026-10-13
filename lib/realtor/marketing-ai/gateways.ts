import type { Gateway } from "./types";

/**
 * Pantallas del core de Marketing que enlaza este centro. Los datos viven en /api/marketing/campaigns,
 * /api/marketing/templates, /api/marketing/posts/recent y /api/social/connections; esta pantalla solo enlaza.
 */
export const GATEWAYS: readonly Gateway[] = [
  { id: "campaigns", href: "/marketing/campaigns",
    title: { es: "Campañas", en: "Campaigns" },
    desc: { es: "Revisa tus campañas y su aprobación.", en: "Review your campaigns and their approval." } },
  { id: "templates", href: "/marketing/templates",
    title: { es: "Plantillas y contenido", en: "Templates and content" },
    desc: { es: "Plantillas y generación de contenido para tus publicaciones.", en: "Templates and content generation for your posts." } },
  { id: "posts", href: "/marketing/social",
    title: { es: "Publicaciones", en: "Posts" },
    desc: { es: "Lo último que se publicó en tus redes.", en: "The latest published on your social networks." } },
  { id: "connections", href: "/marketing/social-connections",
    title: { es: "Conexiones sociales", en: "Social connections" },
    desc: { es: "Qué cuentas de redes tienes conectadas.", en: "Which social accounts are connected." } },
];
