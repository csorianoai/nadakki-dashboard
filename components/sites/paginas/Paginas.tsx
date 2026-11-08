"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { EditorPagina } from "./EditorPagina";
import { ListaPaginas } from "./ListaPaginas";

/** Con ?pagina=<id> abre el editor; sin el, la lista. */
export function Paginas() {
  const pagina = useSearchParams()?.get("pagina") ?? null;
  return pagina ? <EditorPagina pageId={pagina} /> : <ListaPaginas />;
}
