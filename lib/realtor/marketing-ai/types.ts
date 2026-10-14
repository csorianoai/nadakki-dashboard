export type GatewayId = "campaigns" | "templates" | "posts" | "connections";
export const GATEWAY_IDS: readonly GatewayId[] = ["campaigns", "templates", "posts", "connections"];

type Bi = { es: string; en: string };

/** Puerta de solo lectura al core de Marketing: un enlace y, solo en DEMO, un resumen. Nada se ejecuta ni se publica desde aquí. */
export type Gateway = { id: GatewayId; href: string; title: Bi; desc: Bi };

/** Resumen sintético de una puerta (solo DEMO). */
export type GatewaySummary = { id: GatewayId; headline: Bi; items: readonly Bi[] };
