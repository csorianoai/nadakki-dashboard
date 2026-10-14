"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette, type CommandPaletteGroup } from "@/components/forge/ui/CommandPalette";
import { useNavegacionVisible } from "@/components/forge/layout/useNavegacionVisible";
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

  // El botón de la barra superior lo abre con este evento (no comparte estado con el buscador).
  useEffect(() => {
    const abrir = () => setOpen(true);
    window.addEventListener(EVENTO_ABRIR_BUSCADOR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BUSCADOR, abrir);
  }, []);

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

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      groups={groups}
      keyboardShortcut={!enCreditHub}
      placeholder="Buscar una pantalla…"
      emptyMessage="No hay pantallas con ese nombre."
    />
  );
}
