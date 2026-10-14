"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { chRelTime } from "@/lib/credit-hub/bank/bankFormat";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";

/**
 * Campana del banco v2: el mismo hook que el panel actual (useNotifications:
 * GET /api/v2/credit/notifications, sondeo de 2 min, tras
 * NEXT_PUBLIC_CH_NOTIFICATIONS). Apagada o sin endpoint (404/501) no se pinta:
 * nada de campanas vacias que no avisan de nada.
 */
export function CampanaBanco({ hrefSolicitud, onIr }: { hrefSolicitud: (id: string) => string; onIr: (href: string) => void }) {
  const { hidden, items, unreadCount, markAsRead } = useNotifications();
  const [abierta, setAbierta] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierta(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierta]);

  if (hidden) return null;
  const etiqueta = unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : "Notificaciones";
  return (
    <div ref={raiz} className="relative">
      <button type="button" data-testid="banco-campana" aria-label={etiqueta} aria-expanded={abierta} onClick={() => setAbierta((a) => !a)} className={`${DCC_CLASSES.quietButton} relative`}>
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--dcc-error-fg)] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {abierta ? (
        <div
          role="dialog"
          aria-label="Notificaciones"
          data-testid="banco-campana-panel"
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] shadow-[var(--dcc-shadow)]"
        >
          <p className="border-b border-[var(--dcc-border)] px-3 py-2 text-sm font-semibold">Notificaciones</p>
          {items.length === 0 ? (
            <p className={`px-3 py-3 text-sm ${DCC_CLASSES.muted}`}>Sin notificaciones nuevas.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-[var(--dcc-border)] overflow-y-auto">
              {items.slice(0, 20).map((n, i) => (
                <li key={n.id ?? `n-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read && n.id) void markAsRead(n.id).catch(() => undefined);
                      setAbierta(false);
                      if (n.application_id) onIr(hrefSolicitud(n.application_id));
                    }}
                    className="grid w-full gap-0.5 px-3 py-2 text-left text-sm hover:bg-[var(--dcc-surface-muted)]"
                  >
                    <span className={n.read ? "" : "font-semibold"}>{n.title}</span>
                    {n.body ? <span className={`text-xs ${DCC_CLASSES.muted}`}>{n.body}</span> : null}
                    {n.at ? <span className={`text-[11px] ${DCC_CLASSES.subtle}`}>{chRelTime(n.at)}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
