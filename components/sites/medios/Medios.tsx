"use client";

import React, { useState } from "react";
import { pick } from "@/lib/sites/copy-util";
import { MED } from "@/lib/sites/medios/copy";
import { SIZE } from "@/lib/sites/tokens";
import { useSites } from "../shell/SitesContext";
import { FormMedio } from "./FormMedio";
import { ListaMedios } from "./ListaMedios";

/** Alta con registro de permiso + lista con revocar/editar. La aprobacion es de Nadakki. */
export function Medios() {
  const { sites, demo, selectedId, lang } = useSites();
  const [recarga, setRecarga] = useState(0);
  return (
    <div>
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{pick(MED.title, lang)}</h1>
      <FormMedio siteId={selectedId ?? sites[0]?.id ?? null} demo={demo} lang={lang} onDone={() => setRecarga((n) => n + 1)} />
      <ListaMedios recarga={recarga} />
    </div>
  );
}
