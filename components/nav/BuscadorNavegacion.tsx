"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette, type CommandPaletteGroup } from "@/components/forge/ui/CommandPalette";
import { useNavegacionVisible } from "@/components/forge/layout/useNavegacionVisible";
import { TOKENS_PANEL_BARRA } from "@/components/shell/tokens-panel-barra";
import { entradasBuscador } from "@/lib/navigation";

export const EVENTO_ABRIR_BUSCADOR = "nadakki:abrir-buscador";

/**
 * Buscador Ctrl+K / ⌘K de toda la Suite, sobre la MISMA fuente que el menú (lib/navigation.ts) y ya filtrado
 * para el usuario: lo que no ve en el menú tampoco lo encuentra aquí.
 *
 * En Credit Hub manda su propio buscador (ForgeCreditHubCommandPalette, con solicitudes y acciones); aquí no
 * se registra el atajo para no abrir dos a la vez.
 */
export function BuscadorNavegacion() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { secciones } = useNavegacionVisible();
  const enCreditHub = pathname === "/credit-hub" || pathname.startsWith("/credit-hub/");

  // Se abre sin Dialog.Trigger (atajo o evento), así que el diálogo no sabe adónde devolver el foco: se guarda el control
  // que lo tenía al abrir y se le devuelve al cerrar (Esc, clic fuera o elegir), si sigue en la página.
  const origen = useRef<HTMLElement | null>(null);
  const cambiar = useCallback((abierto: boolean) => {
    if (abierto) origen.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    setOpen(abierto);
    if (!abierto) {
      const el = origen.current;
      origen.current = null;
      if (el) setTimeout(() => { if (el.isConnected) el.focus(); }, 0);
    }
  }, []);

  // El botón de la barra superior lo abre con este evento (no comparte estado con el buscador).
  useEffect(() => {
    const abrir = () => cambiar(true);
    window.addEventListener(EVENTO_ABRIR_BUSCADOR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BUSCADOR, abrir);
  }, [cambiar]);

  const groups: CommandPaletteGroup[] = useMemo(() => {
    const porSeccion = new Map<string, CommandPaletteGroup>();
    for (const e of entradasBuscador(secciones)) {
      const g = porSeccion.get(e.seccion) ?? { id: e.seccion, heading: e.seccion, actions: [] };
      g.actions.push({
        id: e.id,
        label: e.label,
        keywords: [e.seccion, e.href, ...e.keywords],
        onSelect: () => router.push(e.href),
      });
      porSeccion.set(e.seccion, g);
    }
    return [...porSeccion.values()];
  }, [secciones, router]);

  // ROP-UX-F3-FIX: el diálogo se pinta con tokens `--forge-*`, que fuera de `.forge-app` (Realtor) no existen; mismos valores que
  // los paneles de la barra, con fondo opaco. `contents`: el envoltorio no crea caja propia.
  return (
    <div className="contents" style={TOKENS_PANEL_BARRA}>
      <CommandPalette
        open={open}
        onOpenChange={cambiar}
        groups={groups}
        keyboardShortcut={!enCreditHub}
        placeholder="Buscar una pantalla…"
        emptyMessage="No hay pantallas con ese nombre."
      />
    </div>
  );
}
