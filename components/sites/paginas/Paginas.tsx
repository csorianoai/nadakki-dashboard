"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { EditorPagina } from "./EditorPagina";
import { ListaPaginas } from "./ListaPaginas";
import { useSites } from "../shell/SitesContext";

/** Sin ?pagina= muestra la lista; con ?pagina=<id> abre el editor. */
export function Paginas() {
  const { sites, selectedId } = useSites();
  const pid = useSearchParams()?.get("pagina") ?? null;
  if (!pid) return <ListaPaginas />;
  return <EditorPagina siteId={selectedId ?? sites[0]?.id ?? null} pageId={pid} />;
}
