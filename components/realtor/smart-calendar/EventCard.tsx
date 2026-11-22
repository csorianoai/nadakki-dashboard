import type { ReactNode } from "react";
import { KIND_LABEL, type Lang } from "@/lib/realtor/smart-calendar/copy";
import type { CalEvent } from "@/lib/realtor/smart-calendar/types";
import { RT } from "@/lib/realtor/tokens";

/** Color del tipo: franja y rótulo. Cita en RT.teal sobre RT.calloutBg (5,3:1); visita en blanco sobre RT.ink. */
const KIND_STYLE = {
  cita: { stripe: RT.teal, bg: RT.calloutBg, fg: RT.teal, line: RT.calloutLine },
  visita: { stripe: RT.ink, bg: RT.ink, fg: RT.white, line: RT.ink },
} as const;

/**
 * Tarjeta de un evento: hora inicio–fin, título (2 líneas, completo en title=), tipo con rótulo y lugar si lo hay.
 * El contrato no trae nombre de propiedad ni de contacto: no se pinta esa línea (Fair Housing: solo el tipo de evento).
 */
export function EventCard({ e, lang, actions }: { e: CalEvent; lang: Lang; actions?: ReactNode }) {
  const k = KIND_STYLE[e.kind];
  const title = e.title[lang];
  return (
    <li data-testid="cal-event" data-kind={e.kind}
      style={{ position: "relative", background: RT.white, border: `1px solid ${RT.line}`, borderLeft: `4px solid ${k.stripe}`, borderRadius: 8,
        padding: "8px 8px 9px 10px", display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <span data-testid="cal-event-time" style={{ fontSize: 13, fontWeight: 700, color: RT.ink, fontVariantNumeric: "tabular-nums", paddingRight: actions ? 36 : 0, minHeight: 24, lineHeight: "24px" }}>
        {e.end ? `${e.start}–${e.end}` : e.start}
      </span>
      <span data-testid="cal-event-title" className="sc-clamp2" title={title} style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: RT.ink }}>
        {title}
      </span>
      <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, fontSize: 13, color: RT.muted }}>
        <span data-testid="cal-event-kind" style={{ background: k.bg, color: k.fg, border: `1px solid ${k.line}`, borderRadius: 999, padding: "1px 8px", fontSize: 13, fontWeight: 700 }}>
          {KIND_LABEL[lang][e.kind]}
        </span>
        {e.place ? <span data-testid="cal-event-place" style={{ minWidth: 0, overflowWrap: "anywhere" }}>{e.place}</span> : null}
      </span>
      {actions}
    </li>
  );
}
